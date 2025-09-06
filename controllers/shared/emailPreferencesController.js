const { Sequelize } = require("sequelize");
const db = require("./../../server");
const AppError = require("../../utils/appError");
const catchAsync = require("./../../utils/catchAsync");
const EmailPreferences = require("./../../models/shared/EmailPreferences");

exports.getEmailPreferences = catchAsync(async (req, res, next) => {
  const emailPreference = await EmailPreferences.findOne({
    where: { userId: req.user.id },
  });

  res.status(200).json({
    status: "success",
    data: { emailPreference },
  });
});

exports.updateEmailPreferences = catchAsync(async (req, res, next) => {
  const filteredBody = {};
  const allowedFields = ["marketingEmailsEnabled", "notificationEmailsEnabled"];

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  await EmailPreferences.update(filteredBody, {
    where: { userId: req.user.id },
  });

  const updatedEmailPreferences = await EmailPreferences.findByPk(req.user.id);

  res.status(200).json({
    status: "success",
    data: { updatedEmailPreferences },
  });
});
