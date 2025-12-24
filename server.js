import express from "express";
import axios from "axios";

const app = express();

app.get("/", (req, res) => res.send("ok"));
app.use(express.json({ limit: "1mb" }));

const RELAY_SECRET = process.env.RELAY_SECRET || "CHANGE_ME";

app.get("/health", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.post("/execute", async (req, res) => {
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${RELAY_SECRET}`) {
    return res.status(401).json({ ok: false, status: 401, text: "UNAUTHORIZED" });
  }

  const { url, method, headers, body } = req.body || {};
  if (!url || !method) {
    return res.status(400).json({ ok: false, status: 400, text: "BAD_REQUEST" });
  }

  try {
    const r = await axios({
      url,
      method,
      headers,
      // body از ورکر ممکنه string باشه یا object؛ همین‌طور پاس بده
      data: body,
      timeout: 20000,
      validateStatus: () => true,

      // خیلی مهم: پاسخ را خام نگه دار تا axios خودش JSON parse نکند
      responseType: "text",
      transformResponse: [(d) => d],
    });

    const text = typeof r.data === "string" ? r.data : JSON.stringify(r.data ?? "");

    return res.json({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      text,                 // ✅ همینی که ورکر می‌خواهد
      headers: r.headers,   // اختیاری (برای دیباگ عالیه)
    });
  } catch (e) {
    return res.json({ ok: false, status: 0, text: String(e?.message || e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Relay listening on", port);
});
