// tidak jadi digunakan karena sudah dihandle monngodb
// const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const moongose = require("mongoose");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const Place = require("../models/place");
const User = require("../models/user");
const getCoordsForAddress = require("../util/location");

//get
const getAllPlaces = async (req, res) => {
  const places = await Place.find().exec();
  res.json(places);
};

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).exec();
  } catch (err) {
    return next(new HttpError("terajdi masalah dalam pebcarian tempat", 500));
  }

  if (!place) {
    return next(new HttpError("tidak dapat menemukan tempat", 404));
  }
  res.json({
    place: place.toObject({ getters: true }), // to object getters unbtuk mendapatkan id dari _id
  });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    return next(new HttpError("terjadi masalah dalam pencarin", 500));
  }

  if (!places || places.length === 0) {
    return next(new HttpError("tidak dapat menemukan tempat", 404));
  }
  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

//create
const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, desc, addres } = req.body;

  let coordinates;
  try {
    coordinates = getCoordsForAddress();
  } catch (error) {
    return next(error);
  }

  const createPlace = new Place({
    title,
    desc,
    addres,
    creator : req.userData.userId,
    image: req.file.path,
    location: coordinates,
  });

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(new HttpError("gagal membuat tempat, tidak ada user", 500));
  }

  if (!user) {
    return next(new HttpError("tidak dapat user ", 404));
  }

  try {
    const sess = await moongose.startSession();
    sess.startTransaction();
    await createPlace.save({ session: sess });
    user.place.push(createPlace); // push adalah metode mongose
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const errr = new HttpError("tidak bisa buat tempat", 500);
    return next(errr);
  }

  res.status(201).json({ palce: createPlace });
};

//update
const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("periksa daat anda", 422);
  }
  const { title, desc } = req.body;
  const placeId = req.params.pid;

  let updatePlace;
  try {
    updatePlace = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError("tidak dapat melakukan pencarian", 500));
  }

  if(updatePlace.creator.toString() !== req.userData.userId){
    return next(new HttpError("tkamu tudajkk didijnkan mengedit", 401));
  }

  updatePlace.title = title;
  updatePlace.desc = desc;

  try {
    await updatePlace.save();
  } catch (err) {
    return next(new HttpError("tidak dapat menyimpan", 500));
  }

  res.status(200).json({ place: updatePlace.toObject({ getters: true }) });
};

//delete
const deletePLace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator"); //akses ke user lewat creator, hanya bisa dil;kaukan jika sudah ref di model
  } catch (err) {
    return next(new HttpError("tidak bisa mecari tempat", 500));
  }

  if (!place) {
    return next(new HttpError("tidak dapat menemukan tempat", 404));
  }

  if(place.creator.id !== req.userData.userId){
    return next(new HttpError("tkamu tudajkk didijnkan menghapus", 403));
  }


  const imagePath = place.image;

  try {
    const sess = await moongose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.place.pull(place); // pull adalah metode mongose
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(new HttpError("tidak bisa mengapus tempat", 500));
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });
  res.status(200).json({ message: "sudah terhapus" });
};
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePLace = deletePLace;
exports.getAllPlaces = getAllPlaces;
