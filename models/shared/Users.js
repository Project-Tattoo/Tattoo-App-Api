const { DataTypes } = require("sequelize");
const db = require("./../../server");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const Users = db.define(
  "users",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    publicId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Must be a valid email address.",
        },
        notNull: {
          msg: "Email is required.",
        },
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Password is required.",
        },
        len: {
          args: [8, 255],
          msg: "Password must be at least 8 characters long.",
        },
      },
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    displayName: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      validate: {
        notNull: {
          msg: "Must provide a display name",
        },
        len: {
          args: [3, 50],
          msg: "Display name must be between 3 and 50 characters.",
        },
      },
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: "Bio cannot exceed 1000 characters.",
        },
      },
    },
    socialMediaLinks: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    profilePictureUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "www.defaultpfp.com",
      validate: {
        isUrl: {
          msg: "Profile picture URL must be a valid URL.",
        },
        notNull: {
          msg: "Profile picture URL is required.",
        },
      },
    },
    searchVector: {
      type: DataTypes.TSVECTOR,
      allowNull: true,
    },
    totalViews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
        isInt: true,
      },
    },
    totalFollowers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: { min: 0, isInt: true },
    },
    lastActivityAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    passwordChangedAt: DataTypes.DATE,
    passwordResetToken: DataTypes.STRING,
    passwordResetExpires: DataTypes.DATE,
    role: {
      type: DataTypes.ENUM("artist", "user", "admin"),
      allowNull: false,
      defaultValue: "user",
      validate: {
        notNull: {
          msg: "User role is required.",
        },
        isIn: {
          args: [["artist", "user", "admin"]],
          msg: "Invalid user role. Must be 'artist', 'client', or 'admin'.",
        },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    verifiedEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    verifyToken: DataTypes.STRING,
    verifyExpires: DataTypes.DATE,
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["publicId"],
        name: "users_public_id_unique_idx",
      },
      {
        unique: true,
        fields: ["email"],
        name: "users_email_unique_idx",
      },
      {
        fields: ["role"],
        name: "users_role_idx",
      },
      {
        fields: ["isActive"],
        name: "users_is_active_idx",
      },
      {
        fields: ["verifiedEmail"],
        name: "users_verified_email_idx",
      },
      {
        fields: ["passwordResetToken"],
        name: "users_password_reset_token_idx",
      },
      {
        fields: ["verifyToken"],
        name: "users_verify_token_idx",
      },
      {
        unique: true,
        fields: ["displayName"],
        name: "users_profiles_display_name_unique_idx",
      },
      {
        fields: ["totalViews"],
        name: "user_profiles_total_views_idx",
      },
      {
        fields: ["lastActivityAt"],
        name: "user_profiles_last_activity_at_idx",
      },
      {
        fields: ["searchVector"],
        using: "GIN",
        name: "users_search_vector_idx",
      },
    ],
    hooks: {
      beforeSave: async (user) => {
        if (user.changed("passwordHash")) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
          user.passwordChangedAt = new Date(Date.now() - 1000);
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
  if (!this.passwordChangedAt) return false;
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
