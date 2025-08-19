const express = require("express");
const usersController = require("./../../controllers/shared/usersController");
const authController = require("./../../controllers/shared/authController");
const usersRouter = express.Router();

usersRouter
  .route("/me")
  .get(authController.protect, usersController.getMe)
  .patch(authController.protect, usersController.updateMe);
usersRouter.route("/:publidId").get(usersController.getUsersPublicProfile);
usersRouter
  .route("/recommended-artists")
  .get(usersController.getRecommendedArtists);
usersRouter.route("/all-artists").get(usersController.getAllArtists);

module.exports = usersRouter;
