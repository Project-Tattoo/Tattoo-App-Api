const Sequelize = require("sequelize");
const db = require("./../../server");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const Users = db.define(
  "users",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: Sequelize.STRING,
      required: true,
      allowNull: false,
    },
    passwordChangedAt: Sequelize.DATE,
    passwordResetToken: Sequelize.STRING,
    passwordResetExpires: Sequelize.DATE,
    role: {
      type: Sequelize.ENUM("artist", "client", "admin"),
      required: true,
      allowNull: false,
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    verifiedEmail: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed("passwordHash")) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
        }
      },
    },
  }
);

Users.prototype.correctPassword = async function (
  candidatePassword,
  storedPassword
) {
  return await bcrypt.compare(candidatePassword, storedPassword);
};

Users.prototype.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt === null) return false;
  const changedTimestamp = parseInt(
    this.passwordChangedAt.getTime() / 1000,
    10
  );
  return JWTTimestamp < changedTimestamp;
};

Users.prototype.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

Users.prototype.createVerifyToken = async function () {
  const createVerifyToken = crypto.randomBytes(32).toString("hex");
  this.verifyToken = crypto
    .createHash("sha256")
    .update(createVerifyToken)
    .digest("hex");
  this.verifyExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return createVerifyToken;
};

Users.prototype.verifyEmailToken = async function (submittedToken) {
  if (Date.now() > this.verifyExpires) {
    throw new Error("Token has expired");
  }
  const submittedTokenHash = crypto
    .createHash("sha256")
    .update(submittedToken)
    .digest("hex");
  if (submittedTokenHash === this.verifyToken) {
    return true;
  } else {
    throw new Error("InvalidToken");
  }
};

module.exports = Users;
