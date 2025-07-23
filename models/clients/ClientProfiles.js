const { DataTypes } = require("sequelize");
const db = require("./../../server");
const Users = require("./../shared/Users");

const ClientProfiles = db.define(
  "clientProfiles",
  {
    userId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "An profile must be linked to a user account",
        },
      },
      references: {
        model: Users,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    publicId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false,
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
    totalViews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: { min: 0, isInt: true },
    },
    lastActivityAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["publicId"],
        name: "client_profiles_public_id_unique_idx",
      },
      {
        unique: true,
        fields: ["displayName"],
        name: "client_profiles_display_name_unique_idx",
      },
      { fields: ["userId"], name: "client_profiles_userid_idx" },
      { fields: ["totalViews"], name: "client_profiles_total_views_idx" },
      {
        fields: ["lastActivityAt"],
        name: "client_profiles_last_activity_at_idx",
      },
    ],
  }
);

module.exports = ClientProfiles;
