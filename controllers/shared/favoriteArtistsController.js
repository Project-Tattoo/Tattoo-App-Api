const { Sequelize } = require("sequelize");
const db = require("./../../server");
const AppError = require("../../utils/appError");
const catchAsync = require("./../../utils/catchAsync");
const FavoriteArtists = require("./../../models/shared/FavoriteArtists");

exports.getFavoriteArtists = catchAsync(async (req, res, next) => {
  const usersFavoriteArtists = await FavoriteArtists.findAll({
    where: { userId: req.user.id },
    order: [["favoritedAt", "DESC"]],
  });

  res.status(200).json({ status: "success", data: { usersFavoriteArtists } });
});

exports.getPublicUsersFavoriteArtists = catchAsync(async (req, res, next) => {
  const usersFavoriteArtists = await FavoriteArtists.findAll({
    where: { publicId: req.params.publicId },
    order: [["favoritedAt", "DESC"]],
  });

  res.status(200).json({ status: "success", data: { usersFavoriteArtists } });
});

exports.addFavoriteArtist = catchAsync(async (req, res, next) => {
  await FavoriteArtists.create({
    userId: req.user.id,
    artistId: req.params.artistId,
  });

  const usersFavoriteArtists = await FavoriteArtists.findAll({
    where: { userId: req.user.id },
    order: [["favoritedAt", "DESC"]],
  });

  res.status(201).json({ status: "success", data: { usersFavoriteArtists } });
});
