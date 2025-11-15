const express = require("express");
const app = express();

app.get("/hello", (req, res) => {
  console.log("req", req);
  res.send({ hi: "hello" });
});


app.listen(4999)
