const { Sequelize } = require("sequelize");
const db = require("./../../server");
const AppError = require("../../utils/appError");
const catchAsync = require("./../../utils/catchAsync");
const Users = require("./../../models/shared/Users");
const FavoriteDesigns = require("./../../models/shared/FavoriteDesigns");
const TattooDesigns = require("./../../models/artists/TattooDesigns");

exports.getFavoriteDesigns = catchAsync(async (req, res, next) => {
  const usersFavoriteDesigns = await FavoriteDesigns.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: TattooDesigns,
        as: "design",
        attributes: ["publicId", "title", "thumbnailUrl"],
      },
    ],
    order: [["favoritedAt", "DESC"]],
  });

  res.status(200).json({
    status: "success",
    results: usersFavoriteDesigns.length,
    data: { usersFavoriteDesigns },
  });
});

exports.getPublicUsersFavoriteDesigns = catchAsync(async (req, res, next) => {
  const user = await Users.findOne({
    where: { publicId: req.params.publicId },
    attributes: ["id", "publicId", "displayName"],
  });

  const favoriteDesigns = await FavoriteDesigns.findAll({
    where: { userId: user.id },
    include: [
      {
        model: TattooDesigns,
        as: "design",
        attributes: ["publicId", "title", "thumbnailUrl"],
      },
    ],
    order: [["favoritedAt", "DESC"]],
  });

  const usersFavoriteDesigns = favoriteDesigns.map((fav) => fav.design);

  res.status(200).json({
    status: "success",
    results: usersFavoriteDesigns.length,
    data: { usersFavoriteDesigns },
  });
});

exports.addFavoriteDesign = catchAsync(async (req, res, next) => {
  await FavoriteDesigns.create({
    userId: req.user.id,
    designId: req.params.designId,
  });

  const usersFavoriteDesigns = await FavoriteDesigns.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: TattooDesigns,
        as: "design",
        attributes: ["publicId", "title", "thumbnailUrl"],
      },
    ],
    order: [["favoritedAt", "DESC"]],
  });

  res.status(200).json({
    status: "success",
    results: usersFavoriteDesigns.length,
    data: { usersFavoriteDesigns },
  });
});

exports.removeFavoriteDesigns = catchAsync(async (req, res, next) => {
  const favorite = await FavoriteDesigns.findOne({
    where: { userId: req.user.id, designId: req.params.designId },
  });

  if (favorite) {
    await favorite.destroy();
  }

  const usersFavoriteDesigns = await FavoriteDesigns.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: TattooDesigns,
        as: "design",
        attributes: ["publicId", "title", "thumbnailUrl"],
      },
    ],
    order: [["favoritedAt", "DESC"]],
  });

  res.status(200).json({
    status: "success",
    results: usersFavoriteDesigns.length,
    data: { usersFavoriteDesigns },
  });
});
