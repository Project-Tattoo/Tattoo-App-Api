const { Sequelize } = require("sequelize");
const db = require("./../../server");
const AppError = require("../../utils/appError");
const catchAsync = require("./../../utils/catchAsync");
const Users = require("./../../models/shared/Users");
const EmailPreferences = require("./../../models/shared/EmailPreferences");
const TOSAgreement = require("./../../models/shared/TOSAgreement");
const ArtistDetails = require("./../../models/artists/ArtistDetails");
const VerificationApplications = require("./../../models/artists/VerificationApplications");
const FavoriteAritsts = require("./../../models/shared/FavoriteArtists");
const FavoriteDesigns = require("./../../models/shared/FavoriteDesigns");
const CommissionArtworks = require("./../../models/shared/CommissionArtworks");
const CommissionListing = require("./../../models/artists/CommissionListing");
const PortfolioCollections = require("./../../models/artists/PortfolioCollections");

exports.getMe = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await Users.findByPk(userId, {
      include: [
        {
          model: EmailPreferences,
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
        {
          model: TOSAgreement,
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
        {
          model: ArtistDetails,
          attributes: { exclude: ["createdAt", "updatedAt"] },
          include: [
            {
              model: VerificationApplications,
              attributes: { exclude: ["createdAt", "updatedAt"] },
            },
          ],
        },
      ],
      attributes: {
        exclude: [
          "passwordHash",
          "stripeCustomerId",
          "lastActivityAt",
          "passwordChangedAt",
          "passwordResetToken",
          "passwordResetExpires",
          "emailChangeToken",
          "emailChangeExpires",
          "reactivateAccountToken",
          "reactivateAccountExpires",
          "verifyToken",
          "verifyExpires",
          "createdAt",
          "updatedAt",
        ],
      },
    });

    if (!user) return next(new AppError("User not found", 404));

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    return next(
      new AppError("There was an error while fetching user data", 400)
    );
  }
});

exports.updateMe = catchAsync(async (req, res, next) => {
  try {
    const filteredBody = {};
    const allowedFields = [
      "firstName",
      "lastName",
      "displayName",
      "bio",
      "socialMediaLinks",
    ];

    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredBody[key] = req.body[key];
      }
    });

    await Users.update(filteredBody, { where: { id: req.user.id } });

    const updatedUser = Users.findByPk(req.user.id, {
      include: [
        {
          model: EmailPreferences,
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
        {
          model: TOSAgreement,
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
        {
          model: ArtistDetails,
          attributes: { exclude: ["createdAt", "updatedAt"] },
          include: [
            {
              model: VerificationApplications,
              attributes: { exclude: ["createdAt", "updatedAt"] },
            },
          ],
        },
      ],
      attributes: {
        exclude: [
          "passwordHash",
          "stripeCustomerId",
          "lastActivityAt",
          "passwordChangedAt",
          "passwordResetToken",
          "passwordResetExpires",
          "emailChangeToken",
          "emailChangeExpires",
          "reactivateAccountToken",
          "reactivateAccountExpires",
          "verifyToken",
          "verifyExpires",
          "createdAt",
          "updatedAt",
        ],
      },
    });

    res.status(200).json({ status: "success", data: { updatedUser } });
  } catch (error) {
    return next(
      new AppError("There was an error while updating user details", 400)
    );
  }
});

exports.getUsersPublicProfile = catchAsync(async (req, res, next) => {
  try {
    // We need to include artistDetails, a count of FavoriteArtists, a count of FavoriteDesigns,
    // the 5 most recent CommissionArtworks that have a isPublic value of true,
    // a count of their CommissionListings as well as their 5 most viewed listings through the "totalViews" key,
    // and their PortfolioCollections
    const user = await Users.findOne({
      where: { publicId: req.params.id },
      attributes: [
        "id",
        "publicId",
        "firstName",
        "lastName",
        "displayName",
        "bio",
        "socialMediaLinks",
        "profilePictureUrl",
        "totalViews",
        "totalFollowers",
        "role",
        "isActive",
        [
          db.literal(`(
            SELECT COUNT(*)
            FROM "favoriteArtists" AS "FavoriteArtists"
            WHERE
              "FavoriteArtists"."userId" = "Users"."id"
          )`),
          "favoriteArtistsCount",
        ],
        [
          db.literal(`(
            SELECT COUNT(*)
            FROM "favoriteDesigns" AS "FavoriteDesigns"
            WHERE
              "FavoriteDesigns"."userId" = "Users"."id"
          )`),
          "favoriteDesignsCount",
        ],
        [
          db.literal(`(
            SELECT COUNT(*)
            FROM "commissionListings" AS "CommissionListings"
            WHERE
              "CommissionListings"."artistId" = "Users"."id"
          )`),
          "commissionListingsCount",
        ],
      ],
      include: [
        {
          model: ArtistDetails,
          as: "artistDetail",
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
        {
          model: CommissionArtworks,
          as: "commissionArtworks",
          required: false,
          where: { isPublic: true },
          limit: 5,
          order: [["createdAt", "DESC"]],
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
        {
          model: CommissionListing,
          as: "commissionListings",
          required: false,
          limit: 5,
          order: [["totalViews", "DESC"]],
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
        {
          model: PortfolioCollections,
          as: "portfolioCollections",
          required: false,
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
      ],
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (error) {
    return next(
      new AppError(
        "There was an error while fetching the user public profile",
        400
      )
    );
  }
});

exports.getRecommendedArtists = catchAsync(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const artists = await Users.findAll({
      where: {
        role: "artist",
        isActive: true,
      },
      attributes: {
        exclude: [
          "passwordHash",
          "stripeCustomerId",
          "lastActivityAt",
          "passwordChangedAt",
          "passwordResetToken",
          "passwordResetExpires",
          "emailChangeToken",
          "emailChangeExpires",
          "reactivateAccountToken",
          "reactivateAccountExpires",
          "verifyToken",
          "verifyExpires",
          "createdAt",
          "updatedAt",
        ],
      },
      include: [
        {
          model: ArtistDetails,
          as: "artistDetail",
          attributes: [
            "averageRating",
            "totalReviews",
            "totalCommissionsCompleted",
            "isVerified",
            "stylesOffered",
          ],
        },
      ],
      order: [
        [db.literal('"artistDetail"."isVerified"'), "DESC"],
        [db.literal('"artistDetail"."averageRating"'), "DESC"],
        [db.literal('"artistDetail"."totalCommissionsCompleted"'), "DESC"],
        [db.literal("RANDOM()")],
      ],
      limit,
      offset,
    });

    if (!artists || artists.length === 0) {
      return next(new AppError("No recommended artists found", 404));
    }

    res.status(200).json({
      status: "success",
      results: artists.length,
      data: {
        artists,
      },
    });
  } catch (error) {
    return next(
      new AppError(
        "There was an error while getting the recommended artists",
        400
      )
    );
  }
});

exports.getAllArtists = catchAsync(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const artists = await Users.findAll({
      where: { role: "artist", isActive: true },
      attributes: {
        exclude: [
          "passwordHash",
          "stripeCustomerId",
          "lastActivityAt",
          "passwordChangedAt",
          "passwordResetToken",
          "passwordResetExpires",
          "emailChangeToken",
          "emailChangeExpires",
          "reactivateAccountToken",
          "reactivateAccountExpires",
          "verifyToken",
          "verifyExpires",
          "createdAt",
          "updatedAt",
        ],
      },
      limit,
      offset,
    });

    if (!artists) {
      return next(new AppError("There were no artists found", 404));
    }

    res.status(200).json({
      status: "success",
      results: artists.length,
      data: {
        artists,
      },
    });
  } catch (error) {
    return next(
      new AppError("There was an error while getting all artists", 400)
    );
  }
});
