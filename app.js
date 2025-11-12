// document.addEventListener("DOMContentLoaded", () => {
//   const textInput = document.getElementById("textInput");
//   const batchInput = document.getElementById("batchInput");
//   const submitBtn = document.getElementById("submitBtn");
//   const clearBtn = document.getElementById("clearBtn");
//   const resultsDiv = document.getElementById("results");
//   const statusDiv = document.getElementById("status");

//   function showStatus(msg, type = "info") {
//     statusDiv.innerHTML = `<div class="alert alert-${type}" role="alert">${msg}</div>`;
//   }

//   function clearStatus() { statusDiv.innerHTML = ""; }

//   function renderResults(predictions) {
//     if (!predictions || predictions.length === 0) {
//       resultsDiv.innerHTML = "<div class='text-muted'>No results</div>";
//       return;
//     }
//     const rows = predictions.map(p => {
//       return `
//         <div class="card mb-2">
//           <div class="card-body">
//             <p class="card-text">${escapeHtml(p.text)}</p>
//             <div>
//               <strong>${p.label}</strong>
//               <span class="text-muted">(${p.label_num})</span>
//               <span class="ms-3 badge bg-info text-dark">prob: ${p.probability.toFixed(4)}</span>
//             </div>
//           </div>
//         </div>
//       `;
//     }).join("");
//     resultsDiv.innerHTML = rows;
//   }

//   function escapeHtml(str) {
//     if (!str) return "";
//     return str.replace(/[&<>"'`=\/]/g, function(s) {
//       return ({
//         '&': '&amp;',
//         '<': '&lt;',
//         '>': '&gt;',
//         '"': '&quot;',
//         "'": '&#39;',
//         '/': '&#x2F;',
//         '`': '&#x60;',
//         '=': '&#x3D;'
//       })[s];
//     });
//   }

//   submitBtn.addEventListener("click", async () => {
//     clearStatus();
//     resultsDiv.innerHTML = "";
//     submitBtn.disabled = true;
//     showStatus("Sending request...", "info");

//     // Prepare payload: prefer single text if provided, otherwise batch
//     const single = textInput.value.trim();
//     const batchRaw = batchInput.value.trim();
//     let payload = {};

//     if (single.length > 0 && batchRaw.length > 0) {
//       // both present: send both (single first)
//       const lines = batchRaw.split("\n").map(l => l.trim()).filter(l => l.length > 0);
//       payload = { texts: [single, ...lines] };
//     } else if (single.length > 0) {
//       payload = { text: single };
//     } else if (batchRaw.length > 0) {
//       const lines = batchRaw.split("\n").map(l => l.trim()).filter(l => l.length > 0);
//       payload = { texts: lines };
//     } else {
//       showStatus("Please provide a message in the single input or multiple lines in the batch input.", "warning");
//       submitBtn.disabled = false;
//       return;
//     }

//     try {
//       const res = await fetch("/predict", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       if (!res.ok) {
//         const err = await res.json().catch(() => ({ error: res.statusText }));
//         showStatus(`Error: ${err.error || res.statusText}`, "danger");
//         submitBtn.disabled = false;
//         return;
//       }
//       const data = await res.json();
//       renderResults(data.predictions || []);
//       clearStatus();
//     } catch (e) {
//       console.error(e);
//       showStatus("Network error or server not running.", "danger");
//     } finally {
//       submitBtn.disabled = false;
//     }
//   });

//   clearBtn.addEventListener("click", () => {
//     textInput.value = "";
//     batchInput.value = "";
//     resultsDiv.innerHTML = "";
//     clearStatus();
//   });
// });

// // static/js/app.js
// document.addEventListener("DOMContentLoaded", function() {
//   const predictBtn = document.getElementById("predictBtn");
//   const clearBtn = document.getElementById("clearBtn");
//   const single = document.getElementById("single");
//   const status = document.getElementById("status");
//   const results = document.getElementById("results");

//   function setStatus(msg, isError=false) {
//     status.textContent = msg;
//     status.style.color = isError ? "crimson" : "green";
//   }

//   predictBtn.addEventListener("click", async () => {
//     results.innerHTML = "";
//     const text = single.value.trim();
//     if (!text) {
//       setStatus("Please enter a message.", true);
//       return;
//     }
//     setStatus("Sending request...");
//     predictBtn.disabled = true;

//     try {
//       // Relative URL => same origin as page (recommended)
//       const res = await fetch("/predict", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ text })
//       });

//       const json = await res.json();
//       if (!res.ok) {
//         setStatus("Server error: " + (json.error || res.statusText), true);
//         console.error("Error response:", json);
//       } else {
//         setStatus("Done.");
//         // render predictions
//         const preds = json.predictions || [];
//         results.innerHTML = preds.map(p =>
//           `<div style="border:1px solid #ddd;padding:8px;margin-top:8px">
//              <div>${escapeHtml(p.text)}</div>
//              <div><strong>${p.label}</strong> (${p.label_num}) — prob: ${p.probability.toFixed(4)}</div>
//            </div>`
//         ).join("");
//       }
//     } catch (err) {
//       setStatus("Network or server error. See console.", true);
//       console.error(err);
//     } finally {
//       predictBtn.disabled = false;
//     }
//   });

//   clearBtn.addEventListener("click", () => {
//     single.value = "";
//     results.innerHTML = "";
//     setStatus("");
//   });

//   function escapeHtml(s) {
//     return s.replace(/[&<>"']/g, function(m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
//   }
// });

// static/js/app.js
// Simple frontend for /predict endpoint. Uses relative URL so it works when served from same Flask app.

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("singleInput");
  const predictBtn = document.getElementById("predictBtn");
  const clearBtn = document.getElementById("clearBtn");
  const statusDiv = document.getElementById("status");
  const resultsDiv = document.getElementById("results");

  function setStatus(msg, isError = false) {
    statusDiv.textContent = msg;
    statusDiv.style.color = isError ? "crimson" : "green";
  }

  function clearResults() {
    resultsDiv.innerHTML = "";
  }

  function renderResults(predictions) {
    clearResults();
    if (!predictions || predictions.length === 0) {
      resultsDiv.innerHTML = "<div class='card'>No predictions returned.</div>";
      return;
    }
    const html = predictions.map(p => {
      // sanitize text for display
      const safeText = String(p.text).replace(/[&<>"'`=\/]/g, s => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'
      })[s]);
      return `
        <div class="card">
          <div><strong>Message</strong></div>
          <div style="margin:6px 0; white-space:pre-wrap;">${safeText}</div>
          <div><strong>Label:</strong> ${p.label} <span style="color:#555">(${p.label_num})</span>
            <span style="margin-left:12px;"><strong>Prob:</strong> ${Number(p.probability).toFixed(4)}</span>
          </div>
        </div>
      `;
    }).join("");
    resultsDiv.innerHTML = html;
  }

  async function doPredict() {
    const text = input.value.trim();
    if (!text) {
      setStatus("Please enter a message to predict.", true);
      return;
    }

    setStatus("Sending request...");
    predictBtn.disabled = true;
    clearResults();

    const payload = { text };

    try {
      const res = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // debug: log response status in console
      console.log("Response status:", res.status);

      // try to parse JSON, but guard for non-JSON responses
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Server error response:", data);
        const msg = (data && data.error) ? data.error : `Server returned ${res.status}`;
        setStatus(msg, true);
      } else {
        setStatus("Prediction returned.");
        console.log("Prediction payload:", data);
        renderResults(data.predictions || []);
      }
    } catch (err) {
      console.error("Network or JS error:", err);
      setStatus("Network error or server not running. See console for details.", true);
    } finally {
      predictBtn.disabled = false;
    }
  }

  predictBtn.addEventListener("click", (ev) => {
    ev.preventDefault();
    doPredict();
  });

  clearBtn.addEventListener("click", (ev) => {
    ev.preventDefault();
    input.value = "";
    setStatus("");
    clearResults();
  });
});