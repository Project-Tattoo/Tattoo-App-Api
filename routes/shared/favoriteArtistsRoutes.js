const express = require("express");
const authController = require("./../../controllers/shared/authController");
const favoriteArtistsController = require("./../../controllers/shared/favoriteArtistsController");

const favoriteArtistsRouter = express.Router();

favoriteArtistsRouter
  .route("/")
  .get(authController.protect, favoriteArtistsController.getFavoriteArtists);

favoriteArtistsRouter
  .route("/public/:publicId")
  .get(favoriteArtistsController.getPublicUsersFavoriteArtists);

favoriteArtistsRouter
  .route("/:artistId")
  .post(authController.protect, favoriteArtistsController.addFavoriteArtist)
  .delete(authController.protect, favoriteArtistsController.removeFavoriteArtist);

module.exports = favoriteArtistsRouter;
