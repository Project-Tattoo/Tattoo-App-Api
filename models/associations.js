const db = require("./../server");
const Sequelize = require("sequelize");

const Users = require("./shared/Users");
const EmailPreference = require("./shared/EmailPreferences");
const TOSAgreement = require("./shared/TOSAgreement");
const ArtistProfiles = require("./artists/ArtistProfiles");
const VerificationApplications = require("./artists/VerificationApplications");
const TattooDesigns = require("./artists/TattooDesigns");

// Shared
Users.hasOne(EmailPreference, { foreignKey: "userId" });
EmailPreference.belongsTo(Users, { foreignKey: "userId" });
Users.hasMany(TOSAgreement, { foreignKey: "userId" });
TOSAgreement.belongsTo(Users, { foreignKey: "userId" });

// Artists
ArtistProfiles.belongsTo(Users, { foreignKey: "userId" });
Users.hasOne(ArtistProfiles, { foreignKey: "userId" });
ArtistProfiles.hasMany(VerificationApplications, { foreignKey: "artistId" });
VerificationApplications.belongsTo(ArtistProfiles, { foreignKey: "artistId" });
ArtistProfiles.hasMany(TattooDesigns, { foreignKey: "artistId" });
TattooDesigns.belongsTo(ArtistProfiles, { foreignKey: "artistId" });

module.exports = {
  db,
  Users,
  EmailPreference,
  TOSAgreement,
  ArtistProfiles,
  VerificationApplications,
  TattooDesigns,
};
