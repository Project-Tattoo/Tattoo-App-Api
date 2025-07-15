const db = require("./../server");
const Sequelize = require("sequelize");

const Users = require("./shared/Users");
const EmailPreference = require("./shared/EmailPreferences");
const TOSAgreement = require("./shared/TOSAgreement");

// Shared
Users.hasOne(EmailPreference, { foreignKey: "userId" });
EmailPreference.belongsTo(Users, { foreignKey: "userId" });
Users.hasMany(TOSAgreement, { foreignKey: "userId" });
TOSAgreement.belongsTo(Users, { foreignKey: "userId" });
