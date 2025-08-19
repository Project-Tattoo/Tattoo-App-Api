const express = require("express");
const usersController = require("./../../controllers/shared/usersController");
const authController = require("./../../controllers/shared/authController");
const usersRouter = express.Router();

usersRouter.route("/me").get(authController.protect, usersController.getMe);

module.exports = usersRouter;
