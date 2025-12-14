const API_URL = "http://localhost:8000/predict"; // correct port

document.getElementById("submitBtn").addEventListener("click", async () => {
    const singleText = document.getElementById("textInput").value.trim();
    const batchText = document.getElementById("batchInput").value.trim();
    const statusDiv = document.getElementById("status");
    const resultsDiv = document.getElementById("results");

    resultsDiv.innerHTML = "";
    statusDiv.innerHTML = "Predicting... ⏳";

    let payload = null;

    // ✅ Single message
    if (singleText !== "") {
        payload = { text: singleText };
    }
    // ✅ Batch messages
    else if (batchText !== "") {
        const texts = batchText
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean);

        payload = { texts };   // ✅ FIXED (messages → texts)
    }
    else {
        statusDiv.innerHTML = "<span class='text-danger'>Please enter a message.</span>";
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        statusDiv.innerHTML = "";

        /* =============================
           BACKEND RETURNS:
           { predictions: [...] }
        ============================== */

        if (data.predictions && Array.isArray(data.predictions)) {
            let html = `<h4 class="mb-3">Results</h4>`;

            data.predictions.forEach((item, idx) => {
                const color = item.label === "SPAM" ? "danger" : "success";

                html += `
                    <div class="alert alert-${color}">
                        <strong>Message ${idx + 1}:</strong><br>
                        ${item.text}<br>
                        <strong>Result:</strong> ${item.label}<br>
                        <strong>Confidence:</strong> ${(item.probability * 100).toFixed(2)}%
                    </div>
                `;
            });

            resultsDiv.innerHTML = html;
        }
        else {
            resultsDiv.innerHTML = `
                <div class="alert alert-warning">
                    Unexpected API response format
                </div>
            `;
        }

    } catch (error) {
        console.error(error);
        statusDiv.innerHTML = `
            <span class="text-danger">
                API Error: Unable to connect to server
            </span>
        `;
    }
});

/* =============================
   CLEAR BUTTON
============================= */
document.getElementById("clearBtn").addEventListener("click", () => {
    document.getElementById("textInput").value = "";
    document.getElementById("batchInput").value = "";
    document.getElementById("results").innerHTML = "";
    document.getElementById("status").innerHTML = "";
});



// const API_URL = "http://localhost:8000/predict";

// document.getElementById("submitBtn").addEventListener("click", async () => {
//     const textInput = document.getElementById("textInput").value.trim();
//     const statusDiv = document.getElementById("status");
//     const resultsDiv = document.getElementById("results");

//     resultsDiv.innerHTML = "";
//     statusDiv.innerHTML = "Predicting... ⏳";

//     if (textInput === "") {
//         statusDiv.innerHTML =
//             "<span class='text-danger'>Please enter a message.</span>";
//         return;
//     }

//     try {
//         const response = await fetch(API_URL, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({ text: textInput })
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP Error: ${response.status}`);
//         }

//         const data = await response.json();
//         statusDiv.innerHTML = "";

//         // ✅ Expected API response:
//         // { "prediction": "spam", "confidence": 0.85 }

//         const prediction = data.prediction || "unknown";
//         const confidence = data.confidence !== undefined
//             ? (data.confidence * 100).toFixed(2) + "%"
//             : "N/A";

//         const color =
//             prediction.toLowerCase() === "spam" ? "danger" : "success";

//         resultsDiv.innerHTML = `
//             <div class="alert alert-${color}">
//                 <strong>Message:</strong><br>
//                 ${textInput}<br><br>
//                 <strong>Result:</strong> ${prediction.toUpperCase()}<br>
//                 <strong>Confidence:</strong> ${confidence}
//             </div>
//         `;

//     } catch (error) {
//         console.error(error);
//         statusDiv.innerHTML =
//             "<span class='text-danger'>API Error: Unable to connect</span>";
//     }
// });

// /* CLEAR BUTTON */
// document.getElementById("clearBtn").addEventListener("click", () => {
//     document.getElementById("textInput").value = "";
//     document.getElementById("results").innerHTML = "";
//     document.getElementById("status").innerHTML = "";
// });
