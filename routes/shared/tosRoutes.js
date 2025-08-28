const express = require("express");
const authController = require("./../../controllers/shared/authController");
const tosController = require("./../../controllers/shared/tosController")

const tosRouter = express.Router()

tosRouter.route("/").post(authController.protect, tosController.agreeToTos)
tosRouter.route("/me").get(authController.protect, tosController.getAgreedTos)

module.exports = tosRouter