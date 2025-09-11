const express = require("express");
const authController = require("./../../controllers/shared/authController");
const favoriteDesignsController = require("./../../controllers/shared/favoriteDesignsController");

const favoriteDesignsRouter = express.Router();

favoriteDesignsRouter
  .route("/")
  .get(authController.protect, favoriteDesignsController.getFavoriteDesigns);

favoriteDesignsRouter
  .route("/public/:publicId")
  .get(favoriteDesignsController.getPublicUsersFavoriteDesigns);

favoriteDesignsRouter
  .route("/:designId")
  .post(authController.protect, favoriteDesignsController.addFavoriteDesign)
  .delete(
    authController.protect,
    favoriteDesignsController.removeFavoriteDesign
  );

module.exports = favoriteDesignsRouter;
