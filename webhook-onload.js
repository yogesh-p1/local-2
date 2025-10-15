<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Auto GET on Load — Cloudflare Worker -> n8n</title>
    <style>
      body {
        font-family: system-ui, -apple-system, "Segoe UI", Roboto,
          "Helvetica Neue", Arial;
        padding: 20px;
      }
      pre {
        white-space: pre-wrap;
        border: 1px solid #ddd;
        padding: 12px;
        margin-top: 12px;
        background: #fafafa;
      }
      .status {
        margin-top: 8px;
        font-size: 0.95rem;
        color: #555;
      }
    </style>
  </head>
  <body>
    <h1>Auto GET on Load</h1>
    <div class="status" id="status">Waiting for request...</div>
    <pre id="result"></pre>

    <script>
      const WORKER_URL =
        "https://crimson-dust-0d1a.yogeshdeployedapps.workers.dev/"; // <-- replace

      const statusEl = document.getElementById("status");
      const resultEl = document.getElementById("result");

      async function callWorkerGET() {
        statusEl.textContent = "Calling GET " + WORKER_URL;
        resultEl.textContent = "";

        try {
          const res = await fetch(WORKER_URL, {
            method: "GET",
            // Do NOT include a body for GET requests
            // credentials: "include" // enable only if Worker uses Access-Control-Allow-Credentials
          });

          // Show HTTP-level errors clearly
          if (!res.ok) {
            const text = await res.text();
            statusEl.textContent = `HTTP ${res.status} ${res.statusText}`;
            resultEl.textContent =
              text || `No response body (HTTP ${res.status})`;
            return;
          }

          // Try parse JSON, fallback to text
          const raw = await res.text();
          try {
            const data = JSON.parse(raw);
            resultEl.textContent = JSON.stringify(data, null, 2);
          } catch (err) {
            // Not JSON — show raw text/html
            resultEl.textContent = raw;
          }

          statusEl.textContent = `Success (HTTP ${res.status})`;
        } catch (err) {
          statusEl.textContent = "Fetch failed";
          resultEl.textContent = "Error: " + err.message;
        }
      }

      // Run on initial load
      window.addEventListener("DOMContentLoaded", () => {
        callWorkerGET();
      });

      // Also run when page is restored from bfcache (back/forward navigation)
      window.addEventListener("pageshow", (event) => {
        if (event.persisted) callWorkerGET();
      });

      // Optional: uncomment to poll every N ms (e.g. 5 minutes = 300000)
      // const autoRefresh = false;
      // if (autoRefresh) setInterval(callWorkerGET, 300000);
    </script>
  </body>
</html>
