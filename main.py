# main.py
import os
import logging
import joblib
import numpy as np
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("spam-flask-api")

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# Paths (env override possible)
VECT_PATH = os.getenv("VECT_PATH", "models/tfidf_vectorizer.joblib")
MODEL_PATH = os.getenv("MODEL_PATH", "models/logistic_model.joblib")
PIPELINE_PATH = os.getenv("PIPELINE_PATH", "models/pipeline.joblib")

# Globals
vec = None
model = None
pipeline = None
using_pipeline = False


def try_load(path):
    if not os.path.exists(path):
        logger.info("Not found: %s", path)
        return None
    try:
        obj = joblib.load(path)
        logger.info("Loaded object from %s", path)
        return obj
    except Exception as e:
        logger.exception("Failed loading %s: %s", path, e)
        return None


def is_vectorizer_fitted(v):
    """
    Check minimal fitted state for a TfidfVectorizer/CountVectorizer.
    TfidfVectorizer when fitted has attributes 'vocabulary_' and 'idf_' (if use_idf=True).
    CountVectorizer has 'vocabulary_' when fitted.
    """
    if v is None:
        return False
    # vocabulary_ present when fitted
    if not hasattr(v, "vocabulary_"):
        return False
    # if it's a TfidfVectorizer and use_idf is True, ensure idf_ exists
    if getattr(v, "use_idf", False):
        return hasattr(v, "idf_")
    return True


# Try to load a saved pipeline first (recommended)
pipeline = try_load(PIPELINE_PATH)
if pipeline is not None:
    # If the loaded pipeline is actually a Pipeline, we will use it end-to-end.
    from sklearn.pipeline import Pipeline as SKPipeline
    if isinstance(pipeline, SKPipeline):
        using_pipeline = True
        logger.info("Using loaded sklearn Pipeline for inference.")
    else:
        # it might be some other object; keep pipeline None
        logger.info("Loaded pipeline object is not an sklearn Pipeline. Will attempt individual loads.")
        pipeline = None

if not using_pipeline:
    # Load separate vectorizer and model
    vec = try_load(VECT_PATH)
    model = try_load(MODEL_PATH)

    # If model file is actually a Pipeline (user saved pipeline to model path), use it
    if model is not None:
        from sklearn.pipeline import Pipeline as SKPipeline
        if isinstance(model, SKPipeline):
            pipeline = model
            model = None
            using_pipeline = True
            logger.info("Model file was a Pipeline; using that pipeline for inference.")

    # Validate vectorizer is fitted
    if vec is not None and not is_vectorizer_fitted(vec):
        logger.error(
            "Loaded vectorizer appears to be UNFITTED (missing vocabulary_/idf_). "
            "This will cause 'idf vector is not fitted' errors. "
            "Please re-fit and re-save the vectorizer or save a pipeline."
        )
        # Keep it loaded but mark as None to force clear error on requests
        vec = None


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "using_pipeline": using_pipeline,
        "vectorizer_loaded": vec is not None,
        "model_loaded": model is not None,
        "pipeline_loaded": pipeline is not None
    })

def normalize_texts(input_texts):
    normalized = []
    for t in input_texts:
        normalized.append("" if t is None else str(t))
    return normalized


@app.route("/predict", methods=["POST"])
def predict():
    # If pipeline is available, we can call it directly
    if using_pipeline and pipeline is None:
        return jsonify({"error": "Pipeline expected but not loaded. Recreate pipeline file."}), 500

    if not using_pipeline and (vec is None or model is None):
        # Helpful error message explaining cause and remedy
        return jsonify({
            "error": "Vectorizer or model not loaded or vectorizer not fitted. "
                     "This typically means the saved tfidf_vectorizer.joblib wasn't fitted before saving, "
                     "or files are missing. Run the training script to re-fit and save (see README)."
        }), 500

    if not request.is_json:
        return jsonify({"error": "Request content-type must be application/json."}), 400

    payload = request.get_json()
    texts = []
    if "text" in payload and payload["text"] is not None:
        texts.append(payload["text"])
    if "texts" in payload and payload["texts"] is not None:
        if not isinstance(payload["texts"], list):
            return jsonify({"error": "'texts' must be a list of strings."}), 400
        texts.extend(payload["texts"])
    if len(texts) == 0:
        return jsonify({"error": "Request must include 'text' or 'texts' with at least one item."}), 400

    texts = normalize_texts(texts)

    try:
        if using_pipeline:
            # Pipeline includes vectorizer and model; pipeline.predict_proba etc.
            X_in = texts
            if hasattr(pipeline, "predict_proba"):
                probs = pipeline.predict_proba(X_in)[:, 1]
            else:
                # try decision_function fallback
                if hasattr(pipeline, "decision_function"):
                    dec = pipeline.decision_function(X_in)
                    dec = np.asarray(dec, dtype=float)
                    dmin, dmax = dec.min(), dec.max()
                    probs = (dec - dmin) / (dmax - dmin) if dmax - dmin != 0 else np.zeros_like(dec)
                else:
                    probs = np.zeros((len(texts),))
            preds = pipeline.predict(X_in)
        else:
            X = vec.transform(texts)  # if vec was unset, we already returned 500 above
            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(X)[:, 1]
            else:
                if hasattr(model, "decision_function"):
                    dec = model.decision_function(X)
                    dec = np.asarray(dec, dtype=float)
                    dmin, dmax = dec.min(), dec.max()
                    probs = (dec - dmin) / (dmax - dmin) if dmax - dmin != 0 else np.zeros_like(dec)
                else:
                    probs = np.zeros((X.shape[0],))
            preds = model.predict(X)
    except Exception as e:
        logger.exception("Inference failed: %s", e)
        return jsonify({"error": f"Inference failed: {str(e)}"}), 500

    out = []
    for text, p, prob in zip(texts, preds, probs):
        out.append({
            "text": text,
            "label": "SPAM" if int(p) == 1 else "NOT SPAM",
            "label_num": int(p),
            "probability": float(round(float(prob), 4))
        })

    return jsonify({"predictions": out})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port)