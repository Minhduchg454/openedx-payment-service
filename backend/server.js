const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const apiRouter = require("./router");

const PORT = process.env.PORT || 3000;
const FRONTEND_DIST = path.join(__dirname, "../frontend/dist");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(FRONTEND_DIST));

app.use("/", apiRouter);

/**
 Tutor redirect tới: localhost:3000/checkout
 Backend khong xu ly logic, backend tra ve index.html
 Brower chay react, React đọc window.location.search
 React goi api that
 */
app.get("/checkout", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
