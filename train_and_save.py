# train_and_save.py
# Usage:
#   python train_and_save.py --csv_path spam.csv --outdir models
# This script fits a TfidfVectorizer + LogisticRegression on the classic SMS spam CSV
# (the same layout used in your notebook with columns v1 (label) and v2 (text)),
# saves: tfidf_vectorizer.joblib, logistic_model.joblib and pipeline.joblib (recommended).
import argparse
import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

def main(csv_path, outdir):
    os.makedirs(outdir, exist_ok=True)
    print("Loading CSV:", csv_path)
    # This matches your notebook: the dataset has columns v1 (label) and v2 (text)
    df = pd.read_csv(csv_path, encoding="latin-1", usecols=['v1','v2'])
    df.columns = ['label', 'text']
    df = df.dropna(subset=['text'])
    df['label_num'] = df['label'].map({'ham': 0, 'spam': 1})
    X = df['text']
    y = df['label_num']

    # train-test split (not strictly needed but we keep it)
    X_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y, test_size=0.2, random_state=42)

    # Fit vectorizer
    vec = TfidfVectorizer(max_features=5000, ngram_range=(1,2))
    Xtr = vec.fit_transform(X_train)
    print("Vectorizer fitted. Vocabulary size:", len(vec.vocabulary_))

    # Train classifier
    lr = LogisticRegression(solver='liblinear', max_iter=1000)
    lr.fit(Xtr, y_train)
    print("Classifier trained.")

    # Save separate artifacts
    joblib.dump(vec, os.path.join(outdir, 'tfidf_vectorizer.joblib'))
    joblib.dump(lr, os.path.join(outdir, 'logistic_model.joblib'))
    print("Saved tfidf_vectorizer.joblib and logistic_model.joblib in", outdir)

    # Save combined pipeline (recommended)
    pipeline = Pipeline([('tfidf', vec), ('clf', lr)])
    joblib.dump(pipeline, os.path.join(outdir, 'pipeline.joblib'))
    print("Saved pipeline.joblib in", outdir)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--csv_path', type=str, default='spam.csv', help='Path to SMS spam csv (v1,v2 columns)')
    parser.add_argument('--outdir', type=str, default='models', help='Output directory for artifacts')
    args = parser.parse_args()
    main(args.csv_path, args.outdir)