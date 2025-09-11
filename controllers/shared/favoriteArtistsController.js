const { Sequelize } = require("sequelize");
const db = require("./../../server");
const AppError = require("../../utils/appError");
const catchAsync = require("./../../utils/catchAsync");
const FavoriteArtists = require("./../../models/shared/FavoriteArtists");
const Users = require("./../../models/shared/Users");

exports.getFavoriteArtists = catchAsync(async (req, res, next) => {
  const usersFavoriteArtists = await FavoriteArtists.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: Users,
        as: "artist",
        attributes: ["publicId", "displayName", "profilePictureUrl"],
      },
    ],
    order: [["favoritedAt", "DESC"]],
  });

  res.status(200).json({ status: "success", data: { usersFavoriteArtists } });
});

exports.getPublicUsersFavoriteArtists = catchAsync(async (req, res, next) => {
  const user = await Users.findOne({
    where: { publicId: req.params.publicId },
    attributes: ["id", "publicId", "displayName"],
  });

  const favoriteArtists = await FavoriteArtists.findAll({
    where: { userId: user.id },
    include: [
      {
        model: Users,
        as: "artist",
        attributes: ["publicId", "displayName", "profilePictureUrl"],
      },
    ],
    order: [["favoritedAt", "DESC"]],
  });

  const usersFavoriteArtists = favoriteArtists.map((fav) => fav.artist);

  res.status(200).json({
    status: "success",
    data: {
      usersFavoriteArtists,
    },
  });
});

exports.addFavoriteArtist = catchAsync(async (req, res, next) => {
  await FavoriteArtists.create({
    userId: req.user.id,
    artistId: req.params.artistId,
  });

  const usersFavoriteArtists = await FavoriteArtists.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: Users,
        as: "artist",
        attributes: ["id", "publicId", "displayName", "profilePictureUrl"],
      },
    ],
    order: [["favoritedAt", "DESC"]],
  });

  res.status(201).json({ status: "success", data: { usersFavoriteArtists } });
});

exports.removeFavoriteArtist = catchAsync(async (req, res, next) => {
  const favorite = await FavoriteArtists.findOne({
    where: { userId: req.user.id, artistId: req.params.artistId },
  });

  if (favorite) {
    await favorite.destroy();
  }

  const usersFavoriteArtists = await FavoriteArtists.findAll({
    where: { userId: req.user.id },
    individualHooks: true,
    include: [
      {
        model: Users,
        as: "artist",
        attributes: ["id", "publicId", "displayName", "profilePictureUrl"],
      },
    ],
    order: [["favoritedAt", "DESC"]],
  });

  res.status(200).json({ status: "success", data: { usersFavoriteArtists } });
});
