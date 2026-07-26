import express from "express";

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/device/register", (req, res) => {
  const { userId, token } = req.body;
  if (!userId || !token) return res.status(400).json({ error: "userId and token required" });
  res.json({ ok: true });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Listening on ${port}`);
});
