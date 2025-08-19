const { Sequelize } = require("sequelize");
const db = require("./../../server");
const AppError = require("../../utils/appError");
const catchAsync = require("./../../utils/catchAsync");
const Users = require("./../../models/shared/Users");
const EmailPreferences = require("./../../models/shared/EmailPreferences");
const TOSAgreement = require("./../../models/shared/TOSAgreement");
const ArtistDetails = require("./../../models/artists/ArtistDetails");
const VerificationApplications = require("./../../models/artists/VerificationApplications");

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
