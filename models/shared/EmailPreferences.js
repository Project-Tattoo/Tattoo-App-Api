const Sequelize = require("sequelize");
const db = require("../../server");
const Users = require("./Users");

const EmailPreference = db.define(
  "emailPreferences",
  {
    userId: {
      type: Sequelize.BIGINT,
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
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    notificationEmailsEnabled: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  { timestamps: true }
);

module.exports = EmailPreference;
