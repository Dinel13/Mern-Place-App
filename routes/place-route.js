const express = require("express");
const { check } = require("express-validator");

const placesController = require("../controllers/places-controller");
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');


const router = express.Router();

router.get('/api', placesController.getAllPlaces)
router.get("/:pid", placesController.getPlaceById);

router.get("/user/:uid", placesController.getPlacesByUserId);

router.use(checkAuth);

router.post(
  "/",
  fileUpload.single('image'),
  [check("title").not().isEmpty(), check("desc").isLength({ min: 5 })],
  placesController.createPlace
);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("desc").isLength({ min: 5 })],
  placesController.updatePlace
);

router.delete("/:pid", placesController.deletePLace);

module.exports = router;
