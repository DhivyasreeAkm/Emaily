const express = require("express");
const app = express();

app.get("/", (req, res) => {
  console.log("req", req);
  res.send("hi akambaraswaran, your daughter loves her daddy so much but you don't value her and love her");
});


app.listen(4999)
