const { DataTypes } = require("sequelize");
const db = require("../../server");
const Users = require("./Users");

const EmailPreference = db.define(
  "emailPreferences",
  {
    userId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "An email preference setting must be linked to a user",
        },
      },
      references: {
        model: Users,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    marketingEmailsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    notificationEmailsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["userId"], name: "email_preferences_userid_idx" },
      {
        fields: ["marketingEmailsEnabled"],
        name: "email_preferences_marketing_enabled_idx",
      },
      {
        fields: ["notificationEmailsEnabled"],
        name: "email_preferences_notification_enabled_idx",
      },
    ],
  }
);

module.exports = EmailPreference;
