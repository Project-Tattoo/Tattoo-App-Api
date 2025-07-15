const Sequelize = require("sequelize");
const db = require("../../server");

const EmailPreference = db.define("emailPreferences", {
    userId: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    marketingEmailsEnabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    notificationEmailsEnabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {timestamps: true})

module.exports = EmailPreference