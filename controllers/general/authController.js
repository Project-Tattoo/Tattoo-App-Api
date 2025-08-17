const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const catchAsync = require("./../../utils/catchAsync");
const AppError = require("./../../utils/appError");
const Users = require("./../../models/shared/Users");
const EmailPreferences = require("./../../models/shared/EmailPreferences");
const TOSAgreement = require("./../../models/shared/TOSAgreement");
const ArtistDetails = require("./../../models/artists/ArtistDetails");
const db = require("./../../server");
const { Sequelize } = require("sequelize");
const PasswordReset = require("./../../email/classes/passwordReset");
const PasswordChange = require("./../../email/classes/passwordChange");
const PasswordUpdated = require("./../../email/classes/passwordUpdated");
const Welcome = require("./../../email/classes/welcome");
const EmailChange = require("./../../email/classes/emailChange");
const EmailUpdated = require("./../../email/classes/emailUpdated");
const normalizeIpAddress = require("./../../utils/normalizeIpAddress");
const createSendToken = require("./../../utils/createSendToken")

//////////////////////// JWT LOGIC ////////////////////////
/**
 * @function validateToken
 * @description Middleware to validate a JWT token from headers or cookies.
 * Primarily for client-side token validation checks without full authentication.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
exports.validateToken = catchAsync(async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.startsWith("Bearer")
      ? req.headers.authorization.split(" ")[1]
      : req.cookies.jwt;

  if (!token) {
    return res
      .status(401)
      .json({ valid: false, message: "No token provided." });
  }

  try {
    const decoded = await promisify(jwt.verify)(
      token,
      process.env.NODE_ENV === "production"
        ? process.env.PROD_JWT_SECRET
        : process.env.DEV_JWT_SECRET
    );

    res.json({ valid: true, message: "Token is valid." });
  } catch (error) {
    res
      .status(401)
      .json({ valid: false, message: "Invalid or expired token." });
  }
});




//////////////////////// ROUTE PROTECTIONS LOGIC ////////////////////////

/**
 * @function protect
 * @description Middleware to protect routes, ensuring only authenticated users can access them.
 * Verifies JWT, checks if user exists and if password was changed after token issuance.
 * @param {Object} User - The Sequelize User model.
 * @returns {Function} An Express middleware function.
 */
exports.protect = (User) =>
  catchAsync(async (req, res, next) => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    const decoded = await promisify(jwt.verify)(
      token,
      process.env.NODE_ENV === "production"
        ? process.env.PROD_JWT_SECRET
        : process.env.DEV_JWT_SECRET
    );

    const currentUser = await User.findByPk(decoded.id);
    if (!currentUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    const check = await currentUser.changedPasswordAfter(decoded.iat);
    if (check) {
      return next(
        new AppError(
          "Password has been changed since last log in. Please log in again.",
          401
        )
      );
    }

    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  });

/**
 * @function restrictTo
 * @description Middleware to restrict access to routes based on user roles.
 * @param {...string} roles - A list of roles that are allowed to access the route.
 * @returns {Function} An Express middleware function.
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action / access this page",
          403
        )
      );
    }
    next();
  };
};

//////////////////////// USER MANAGEMENT LOGIC ////////////////////////

/**
 * @function signup
 * @description Handles user registration, creating a base User and a role-specific profile.
 * @param {Object} User - The Sequelize User model.
 * @returns {Function} An Express middleware function.
 */
exports.signup = catchAsync(async (req, res, next) => {
  const {
    email,
    firstName,
    lastName,
    password,
    passwordConfirm,
    role,
    displayName,
    city,
    state,
    zipcode,
    stylesOffered,
  } = req.body;

  if (
    !email ||
    !password ||
    !passwordConfirm ||
    !role ||
    !firstName ||
    !lastName
  ) {
    return next(
      new AppError(
        "Please provide first name, last name, email, password, password confirmation, and role.",
        400
      )
    );
  }

  if (password !== passwordConfirm) {
    return next(new AppError("Passwords do not match.", 400));
  }

  if (role === "admin") {
    return next(
      new AppError(
        "Admin accounts cannot be registered via public signup.",
        403
      )
    );
  }

  if (!["artist", "user"].includes(role)) {
    return next(new AppError("Invalid user role specified.", 400));
  }

  if (!displayName) {
    return next(new AppError("Please provide a display name", 400));
  }

  if (role === "artist" && (!city || !state || !zipcode)) {
    return next(
      new AppError(
        "Please provide city, state, and zipcode for artist registration.",
        400
      )
    );
  }

  const t = await db.transaction();
  try {
    let newUser = await Users.create(
      {
        firstName: firstName,
        lastName: lastName,
        email: email.toLowerCase(),
        passwordHash: password,
        displayName: displayName,
        role,
        isActive: true,
        verifiedEmail: false,
      },
      { transaction: t }
    );

    await EmailPreferences.create({ userId: newUser.id }, { transaction: t });

    const ipAddress = normalizeIpAddress(req.ip);

    await TOSAgreement.create(
      {
        userId: newUser.id,
        tosVersion: "1.0",
        agreedAt: new Date(),
        ipAddress,
      },
      { transaction: t }
    );

    if (role === "artist") {
      const artistDetails = await ArtistDetails.create(
        {
          userId: newUser.id,
          city,
          state,
          zipcode,
          stylesOffered: stylesOffered || [],
        },
        { transaction: t }
      );
    }
    if (process.env.NODE_ENV !== "test") {
      console.log("trying to instantiate the email")
      try {
        const welcome = new Welcome({
          recipient: newUser.email,
          firstName: newUser.firstName,
        });
        console.log("trying to send the email")
        await welcome.sendWelcome();
        console.log(`Welcome email sent to ${newUser.email}`);
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
    } else {
      console.log("Skipping password updated email in test environment.");
    }

    await t.commit();

    return createSendToken(newUser, 201, req, res);
  } catch (error) {
    await t.rollback();

    if (error.name === "SequelizeUniqueConstraintError") {
      return next(
        new AppError(
          `Duplicate field value: ${
            error.fields[Object.keys(error.fields)[0]]
          }. Please use another value!`,
          400
        )
      );
    }

    if (error.name === "SequelizeValidationError") {
      const errors = error.errors.map((err) => err.message);
      return next(
        new AppError(`Invalid input data: ${errors.join(". ")}`, 400)
      );
    }

    return next(error);
  }
});

//////////////////////// LOGIN LOGIC ////////////////////////

/**
 * @function login
 * @description Handles user login. Finds user by email and validates password.
 * @returns {Function} An Express middleware function.
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError("Please provide both email and password.", 400));

  const lowerCaseEmail = email.toLowerCase();

  if (!lowerCaseEmail || !password)
    return next(new AppError("Please provide both email and password.", 400));

  const user = await Users.findOne({
    where: { email: lowerCaseEmail },
  });

  if (!user || !(await user.correctPassword(password, user.passwordHash))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  if (!user.isActive) {
    return res.status(403).json({
      status: "fail",
      message:
        "Your account has been deactivated. Please check your email to reactivate.",
    });
  }

  createSendToken(user, 200, req, res);
});

/**
 * @function isLoggedIn
 * @description Middleware to check if a user is currently logged in (based on JWT cookie).
 * Does not block access, but makes user info available if logged in.
 * @returns {Function} An Express middleware function.
 */
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // Removed User param, use Users model directly
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.NODE_ENV === "production"
          ? process.env.PROD_JWT_SECRET
          : process.env.DEV_JWT_SECRET
      );

      const currentUser = await Users.findByPk(decoded.id);
      if (!currentUser) return next();

      if (currentUser.changedPasswordAfter(decoded.iat)) return next();

      req.user = currentUser;
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
});

//////////////////////// PASSWORD LOGIC ////////////////////////

/**
 * @function forgotPassword
 * @description Handles forgotten password requests. Generates a reset token and sends it via email.
 * @returns {Function} An Express middleware function.
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await Users.findOne({
    where: { email: req.body.email },
  });
  if (!user)
    return next(new AppError("There is no user with that email address.", 404));

  const resetToken = await user.createPasswordResetToken();
  await user.save({ validate: false });

  try {
    if (process.env.NODE_ENV !== "test") {
      const resetUrl = `localhost:3000/reset-password/${resetToken}`;
      const passwordReset = new PasswordReset({
        recipient: user.email,
        resetUrl: resetUrl,
      });

      await passwordReset.sendPasswordReset();
    } else {
      console.log("Skipping password updated email in test environment.");
    }
    res.status(200).json({
      status: "success",
      message: "Password reset token sent to email!",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validate: false });

    return next(
      new AppError(
        "There was an error while requesting a password change. Please try again later.",
        500
      )
    );
  }
});

/**
 * @function requestPasswordChange
 * @description Allows a logged-in user to request a password change (sends a token to their email).
 * @returns {Function} An Express middleware function.
 */
exports.requestPasswordChange = catchAsync(async (req, res, next) => {
  try {
    if (!req.user) {
      return next(
        new AppError("User not found in request. Please log in.", 401)
      );
    }

    const user = await Users.findByPk(req.user.id);
    if (!user)
      return next(new AppError("Couldn't find the logged in user.", 404));

    const resetToken = await user.createPasswordResetToken();
    await user.save({ validate: false });

    if (process.env.NODE_ENV !== "test") {
      const resetUrl = `localhost:3000/reset-password/${resetToken}`;
      const passwordChange = new PasswordChange({
        recipient: user.email,
        resetUrl: resetUrl,
      });
      await passwordChange.sendPasswordChange();
    } else {
      console.log("Skipping password updated email in test environment.");
    }
    res.status(200).json({
      status: "success",
      message: "Password change request token sent to your email!",
    });
  } catch (error) {
    console.error("Error caught:", error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validate: false });

    return next(
      new AppError(
        "There was an error while requesting a password change. Please try again later.",
        500
      )
    );
  }
});

/**
 * @function resetPassword
 * @description Resets a user's password using a valid reset token.
 * @returns {Function} An Express middleware function.
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.query.token)
      .digest("hex");

    const user = await Users.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          [Sequelize.Op.gt]: Date.now(),
        },
      },
    });

    if (!user) {
      return next(new AppError("Token is invalid or has expired", 400));
    }

    user.passwordHash = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    if (process.env.NODE_ENV !== "test") {
      const passwordUpdated = new PasswordUpdated({
        recipient: user.email,
        firstName: user.firstName,
      });
      await passwordUpdated.sendPasswordUpdated();
    } else {
      console.log("Skipping password updated email in test environment.");
    }

    createSendToken(user, 200, req, res);
  } catch (error) {
    return next(
      new AppError("There was an error while reseting your password", 500)
    );
  }
});

/**
 * @function updatePassword
 * @description Allows a logged-in user to update their password.
 * @returns {Function} An Express middleware function.
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  try {
    if (!req.user) {
      return next(
        new AppError("User not found in request. Please log in.", 401)
      );
    }

    if (!req.body.password) {
      return next(new AppError("New password cannot be null.", 400));
    }

    const user = await Users.findByPk(req.user.id);

    const isCorrect = await user.correctPassword(
      req.body.passwordCurrent,
      user.passwordHash
    );
    if (!isCorrect) {
      return next(new AppError("Your current password is wrong.", 401));
    }

    user.passwordHash = req.body.password;
    await user.save();

    if (process.env.NODE_ENV !== "test") {
      try {
        const passwordUpdated = new PasswordUpdated({
          recipient: user.email,
          firstName: user.firstName,
        });
        await passwordUpdated.sendPasswordUpdated();
        console.log(`Password updated email sent to ${user.email}`);
      } catch (emailError) {
        console.error("Failed to send password updated email:", emailError);
      }
    } else {
      console.log("Skipping password updated email in test environment.");
    }

    createSendToken(user, 200, req, res);
  } catch (error) {
    return next(
      new AppError("There was an error while updating your password", 500)
    );
  }
});

/**
 * @function requestEmailChange
 * @description Allows a logged-in user to request to update their email.
 * @returns {Function} An Express middleware function.
 */
exports.requestEmailChange = catchAsync(async (req, res, next) => {
  try {
    if (!req.user) {
      return next(
        new AppError("User not found in request. Please log in.", 401)
      );
    }

    const user = await Users.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("Couldn't find the logged in user.", 404));
    }

    const resetToken = await user.createEmailChangeToken();
    await user.save({ validate: false });

    if (process.env.NODE_ENV !== "test") {
      const secureChangeUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/update-email/${encodeURIComponent(resetToken)}`;

      const emailChange = new EmailChange({
        recipient: user.email,
        secureChangeUrl,
      });

      await emailChange.sendEmailChange();
    } else {
      console.log("Skipping password updated email in test environment.");
    }

    res.status(200).json({
      status: "success",
      message: "Email update request token sent to your email!",
    });
  } catch (error) {
    user.emailChangeToken = undefined;
    user.emailChangeExpires = undefined;
    await user.save({ validate: false });

    return next(
      new AppError(
        "There was an error while requesting an email update. Please try again later.",
        500
      )
    );
  }
});

/**
 * @function updateEmail
 * @description Takes in the users new email and updates it in the database.
 * @returns {Function} An Express middleware function.
 */
exports.updateEmail = catchAsync(async (req, res, next) => {
  try {
    const { token, newEmail } = req.body;
    if (!req.user) {
      return next(
        new AppError("User not found in request. Please log in.", 401)
      );
    }

    const user = await Users.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("Couldn't find the logged in user.", 404));
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    if (
      user.emailChangeToken !== hashedToken ||
      Date.now() > user.emailChangeExpires
    ) {
      return next(new AppError("Token is invalid or has expired.", 400));
    }

    const oldEmail = user.email;

    user.email = newEmail;
    user.emailChangeToken = undefined;
    user.emailChangeExpires = undefined;
    await user.save();
    if (process.env.NODE_ENV !== "test") {
      await new EmailUpdated({
        recipient: oldEmail,
        firstName: user.firstName,
        newEmail,
      }).sendEmailUpdated();
      await new EmailUpdated({
        recipient: newEmail,
        firstName: user.firstName,
        newEmail,
      }).sendEmailUpdated();
    } else {
      console.log("Skipping password updated email in test environment.");
    }

    createSendToken(user, 200, req, res);
  } catch (error) {
    new AppError(
      "There was an error while updating your email. Please try again later.",
      500
    );
  }
});

/**
 * @function deactivateProfile
 * @description Does a soft delete flipping the isActive value.
 * @returns {Function} An Express middleware function.
 */
exports.deactivateProfile = catchAsync(async (req, res, next) => {
  try {
    if (!req.user) {
      return next(
        new AppError("User not found in request. Please log in.", 401)
      );
    }

    const user = await Users.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("Couldn't find the logged in user.", 404));
    }

    user.isActive = false;
    await user.save({ validate: false });

    res.cookie("jwt", "loggedout", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res
      .status(200)
      .json({ status: "success", message: "Logged out successfully." });
  } catch (error) {
    new AppError(
      "There was an error while deactivating your account. Please try again later.",
      500
    );
  }
});

/**
 * @function requestAccountReactivation
 * @description Sends an email with a secure link to reactivate a users account.
 * @returns {Function} An Express middleware function.
 */
exports.requestAccountReactivation = catchAsync(async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError("Please provide your email.", 400));

    const user = await Users.findOne({ where: { email: email.toLowerCase() } });
    if (!user)
      return next(new AppError("No account found with that email.", 404));

    if (user.isActive) {
      return next(new AppError("Account is already active.", 400));
    }

    const token = user.createReactivateAccountToken();
    await user.save({ validate: false });

    if (process.env.NODE_ENV !== "test") {
      const reactivationUrl = `${process.env.FRONTEND_URL}/reactivate-account/${token}`;
      await new ReactivateAccountEmail({
        recipient: user.email,
        firstName: user.firstName,
        reactivationUrl,
      }).send();
    } else {
      console.log("Skipping password updated email in test environment.");
    }

    res.status(200).json({
      status: "success",
      message: "Reactivation link sent to your email.",
    });
  } catch (error) {
    new AppError(
      "There was an error while requesting to reactivate your account. Please try again later.",
      500
    );
  }
});

/**
 * @function reactivateProfile
 * @description Re-enables a deactivated profile.
 * @returns {Function} An Express middleware function.
 */
exports.reactivateProfile = catchAsync(async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!req.user) {
      return next(
        new AppError("User not found in request. Please log in.", 401)
      );
    }

    const user = await Users.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("Couldn't find the logged in user.", 404));
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    if (
      user.reactivateAccountToken !== hashedToken ||
      Date.now() > user.reactivateAccountExpires
    ) {
      return next(new AppError("Token is invalid or has expired.", 400));
    }

    user.isActive = true;
    user.reactivateAccountToken = undefined;
    user.reactivateAccountExpires = undefined;
    await user.save();

    createSendToken(user, 200, req, res);
  } catch (error) {
    new AppError(
      "There was an error while reactivating your account. Please try again later.",
      500
    );
  }
});

/**
 * @function deleteProfile
 * @description Permanent hard delete on the signed in user.
 * @returns {Function} An Express middleware function.
 */
exports.deleteProfile = catchAsync(async (req, res, next) => {
  try {
    if (!req.user) {
      return next(
        new AppError("User not found in request. Please log in.", 401)
      );
    }

    const user = await Users.findByPk(req.user.id);
    if (!user) {
      return next(new AppError("Couldn't find the logged in user.", 404));
    }

    await user.destroy();

    res.cookie("jwt", "deleted", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res
      .status(200)
      .json({ status: "success", message: "Deleted profile successfully." });
  } catch (error) {
    new AppError(
      "There was an error while deleting your account. Please try again later.",
      500
    );
  }
});
