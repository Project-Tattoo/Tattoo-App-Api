const { Sequelize } = require("sequelize");
const db = require("./../../server");
const AppError = require("../../utils/appError");
const catchAsync = require("./../../utils/catchAsync");
const TOSAgreement = require("./../../models/shared/TOSAgreement");

exports.getAgreedTos = catchAsync(async (req, res, next) => {
  const tos = await TOSAgreement.findOne({
    where: { userId: req.user.id },
    order: [["createdAt", "DESC"]],
  });

  res.status(200).json({
    status: "success",
    data: tos,
  });
});

exports.agreeToTos = catchAsync(async (req, res, next) => {
  const { tosVersion } = req.body;
  const userId = req.user.id;
  const ipAddress = req.ip;

  const agreement = await TOSAgreement.create({
    userId,
    tosVersion,
    agreedAt: new Date(),
    ipAddress,
  });

  res.status(201).json({
    status: "success",
    data: { agreement },
  });
});
