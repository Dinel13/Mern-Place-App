const fs = require('fs')
const path = require('path')
const express = require("express");
const bodyParser = require("body-parser");
const moongose = require("mongoose");

require('dotenv').config()

const placeRoute = require("./routes/place-route");
const userRoute = require("./routes/user-route");
const HttpError = require("./models/http-error");
const { log } = require('console');
const app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')))

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // semua url disinkan
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/place", placeRoute);
app.use("/api/user", userRoute);

//midleware sebagai defaul jika route tidak ditemukan
app.use((req, res, next) => {
  const error = new HttpError("TIDAK DAPAT MENEMUKAN ROUTE TERSEBUT", 404);
  throw error;
});

//midleware jika ada error yang dikirim dari model httperror
app.use((error, req, res, next) => {
   
  if (req.file) {
    fs.unlink(req.file.path,  err => {
      console.log(err);
    })
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "error tidak diketahui" });
});

moongose
  .connect(
    process.env.ATLAS_URI
  )
  .then(() => app.listen(process.env.PORT || 5000))
  .catch((err) => console.log(err));
