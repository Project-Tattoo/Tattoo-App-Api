const jwt = require("jsonwebtoken");
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
module.exports = createSendToken;
