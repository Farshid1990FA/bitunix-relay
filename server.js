import express from "express";
import axios from "axios";

const app = express();
app.use(express.json({ limit: "1mb" }));

const RELAY_SECRET = process.env.RELAY_SECRET || "CHANGE_ME";

app.get("/health", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.post("/execute", async (req, res) => {
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${RELAY_SECRET}`) {
    return res.status(401).json({ ok: false, err: "UNAUTHORIZED" });
  }

  const { url, method, headers, body } = req.body || {};
  if (!url || !method) {
    return res.json({ ok: false, err: "BAD_REQUEST" });
  }

  try {
    const r = await axios({
      url,
      method,
      headers,
      data: body,
      timeout: 15000,
      validateStatus: () => true,
    });

    res.json({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      data: r.data,
    });
  } catch (e) {
    res.json({ ok: false, err: String(e.message || e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Relay listening on", port);
});
