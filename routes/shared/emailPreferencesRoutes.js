const express = require("express");
const authController = require("./../../controllers/shared/authController");
const emailPreferencesController = require("./../../controllers/shared/emailPreferencesController");

const emailPreferencesRouter = express.Router();

emailPreferencesRouter
  .route("/me")
  .get(authController.protect, emailPreferencesController.getEmailPreferences)
  .patch(authController.protect, emailPreferencesController.updateEmailPreferences);

module.exports = emailPreferencesRouter;
