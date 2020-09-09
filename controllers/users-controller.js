// tidak jadi digunakan karena sudah dihandle monngodb
// const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require('dotenv').config()

const httpError = require("../models/http-error");
const User = require("../models/user");
const HttpError = require("../models/http-error");

const getUsaers = async (req, res, next) => {
  let result;
  try {
    result = await User.find({}, "-password");
  } catch (err) {
    return next(new httpError("tidak bisa mencari user", 500));
  }
  res.json({ users: result.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new httpError("periksa daat anda", 422);
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new httpError("uproses sign up gagal", 500));
  }

  if (existingUser) {
    return next(new httpError("user sudah ada, silahkan sign in", 422));
  }

  let HasPassword;
  try {
    HasPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("tidak bisa buat user, coba lagi nnati", 500);
    return next(error);
  }

  const createuser = new User({
    name,
    email,
    password: HasPassword,
    image: req.file.path,
    place: [],
  });

  let result;
  try {
    result = await createuser.save();
  } catch (err) {
    return next(new httpError("tidfak dapat buat user", 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createuser.id, email: createuser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (error) {
    return next(new httpError("tidfak dapat buat user", 500));
  }

  res
    .status(201)
    .json({ userId: createuser.id, email: createuser.email, token: token });
};


const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      401
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      'Could not log you in, please check your credentials and try again.',
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      401
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token
  });
};


exports.getUsaers = getUsaers;
exports.login = login;
exports.signup = signup;
