const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const catchAsync = require("./../../utils/catchAsync");
const AppError = require("./../../utils/appError");
const Users = require("./../../models/shared/Users");
const EmailPreference = require("./../../models/shared/EmailPreferences");
const TOSAgreement = require("./../../models/shared/TOSAgreement");
const ArtistDetails = require("./../../models/artists/ArtistDetails");
const db = require("./../../server");
const { Sequelize } = require("sequelize");

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

/**
 * @function signToken
 * @description Generates a JWT token for a given user ID.
 * @param {number} id - The user's ID.
 * @returns {string} The signed JWT token.
 */
const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.NODE_ENV === "production"
      ? process.env.PROD_JWT_SECRET
      : process.env.DEV_JWT_SECRET,
    {
      expiresIn:
        process.env.NODE_ENV === "production"
          ? process.env.PROD_JWT_EXPIRES_IN
          : process.env.DEV_JWT_EXPIRES_IN,
    }
  );
};

/**
 * @function createSendToken
 * @description Creates a JWT, sets it as a cookie, and sends the response to the client.
 * @param {Object} user - The user object (Sequelize instance).
 * @param {number} statusCode - The HTTP status code to send.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user.id);

  const cookieExpiresInMs =
    process.env.NODE_ENV === "production"
      ? 4 * 60 * 60 * 1000 + 30 * 60 * 1000
      : 90 * 24 * 60 * 60 * 1000;

  res.cookie("jwt", token, {
    expires: new Date(Date.now() + cookieExpiresInMs),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  user.passwordHash = undefined;

  return res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

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

const normalizeIpAddress = (ip) => {
  if (ip && ip.startsWith("::ffff:")) {
    return ip.substring(7); // Remove '::ffff:'
  }
  return ip;
};

/**
 * @function signup
 * @description Handles user registration, creating a base User and a role-specific profile.
 * @param {Object} User - The Sequelize User model.
 * @returns {Function} An Express middleware function.
 */
exports.signup = catchAsync(async (req, res, next) => {
  const {
    email,
    password,
    passwordConfirm,
    role,
    displayName,
    city,
    state,
    zipcode,
    stylesOffered,
  } = req.body;

  if (!email || !password || !passwordConfirm || !role) {
    return next(
      new AppError(
        "Please provide email, password, password confirmation, and role.",
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
    return next(new AppError("Please provide a display name"), 400);
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
    const newUser = await Users.create(
      {
        email: email.toLowerCase(),
        passwordHash: password,
        displayName: displayName,
        role,
        isActive: true,
        verifiedEmail: false,
      },
      { transaction: t }
    );

    await EmailPreference.create({ userId: newUser.id }, { transaction: t });

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
      await ArtistDetails.create(
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
    // REMINDER: add password email logic once email classes are set up
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
  if (!req.user) {
    return next(new AppError("User not found in request. Please log in.", 401));
  }

  const user = await Users.findByPk(req.user.id);
  if (!user)
    return next(new AppError("Couldn't find the logged in user.", 404));

  const resetToken = await user.createPasswordResetToken();
  await user.save({ validate: false });

  try {
    // REMINDER: add password email logic once email classes are set up
    res.status(200).json({
      status: "success",
      message: "Password change request token sent to your email!",
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
 * @function resetPassword
 * @description Resets a user's password using a valid reset token.
 * @returns {Function} An Express middleware function.
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.query.token)
    .digest("hex");

  console.log("BEFORE USER FIND ONE");
  const user = await Users.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        [Sequelize.Op.gt]: Date.now(),
      },
    },
  });
  console.log("AFTER USER FIND ONE");
  console.log(`USER: ${user}`);

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // REMINDER: Should add email logic to send an email on successful password change, so if it wasnt intentional they can take action

  user.passwordHash = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, req, res);
});

/**
 * @function updatePassword
 * @description Allows a logged-in user to update their password.
 * @returns {Function} An Express middleware function.
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError("User not found in request. Please log in.", 401));
  }
  const user = await Users.findByPk(req.user.id);

  const isCorrect = await user.correctPassword(
    req.body.passwordCurrent,
    user.passwordHash
  );
  if (!isCorrect)
    return next(new AppError("Your current password is wrong.", 401));

  // REMINDER: should add email logic to notify that password has changed

  user.passwordHash = req.body.password;
  await user.save();
  createSendToken(user, 200, req, res);
});
