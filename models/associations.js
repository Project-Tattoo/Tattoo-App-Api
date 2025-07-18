const db = require("./../server");
const Sequelize = require("sequelize");

const Users = require("./shared/Users");
const EmailPreference = require("./shared/EmailPreferences");
const TOSAgreement = require("./shared/TOSAgreement");
const ArtistProfiles = require("./artists/ArtistProfiles");
const VerificationApplications = require("./artists/VerificationApplications");
const TattooDesigns = require("./artists/TattooDesigns");
const Collections = require("./artists/Collections");
const CollectionDesigns = require("./artists/CollectionDesigns");
const CommissionListing = require("./artists/CommissionListing");
const ClientProfiles = require("./clients/ClientProfiles");
const ClientFavoriteDesigns = require("./clients/ClientFavoriteDesigns");
const ClientFavoriteArtists = require("./clients/ClientFavoriteArtists");
const CommissionOrders = require("./shared/CommissionOrders");
const CommissionReviews = require("./shared/CommissionReviews");

// Shared
Users.hasOne(EmailPreference, { foreignKey: "userId" });
EmailPreference.belongsTo(Users, { foreignKey: "userId" });
Users.hasMany(TOSAgreement, { foreignKey: "userId" });
TOSAgreement.belongsTo(Users, { foreignKey: "userId" });

CommissionListing.hasMany(CommissionOrders, {
  foreignKey: "listingId",
  sourceKey: "id",
  onDelete: "SET NULL", 
  allowNull: true 
});

ArtistProfiles.hasMany(CommissionOrders, {
  foreignKey: "artistId",
  sourceKey: "userId",
  onDelete: "SET NULL",
});

CommissionOrders.belongsTo(ArtistProfiles, { foreignKey: "artistId", targetKey: "userId" });

CommissionOrders.belongsTo(CommissionListing, { foreignKey: "listingId", targetKey: "id" });

ArtistProfiles.hasMany(CommissionReviews, {
  foreignKey: "artistId",
  sourceKey: "userId",
  onDelete: "CASCADE",
  as: "commissionReviewsGiven",
});

CommissionReviews.belongsTo(ArtistProfiles, {
  foreignKey: "artistId",
  targetKey: "userId",
});

ClientProfiles.hasMany(CommissionReviews, {
  foreignKey: "clientId",
  sourceKey: "userId",
  onDelete: "SET NULL",
  as: "commissionReviewsWritten",
});
CommissionReviews.belongsTo(ClientProfiles, {
  foreignKey: "clientId",
  targetKey: "userId",
});

// Artists
ArtistProfiles.belongsTo(Users, { foreignKey: "userId" });
Users.hasOne(ArtistProfiles, { foreignKey: "userId" });

ArtistProfiles.hasMany(VerificationApplications, { foreignKey: "artistId" });
VerificationApplications.belongsTo(ArtistProfiles, { foreignKey: "artistId" });

ArtistProfiles.hasMany(TattooDesigns, { foreignKey: "artistId" });
TattooDesigns.belongsTo(ArtistProfiles, { foreignKey: "artistId" });

ArtistProfiles.hasMany(Collections, { foreignKey: "artistId" });
Collections.belongsTo(ArtistProfiles, { foreignKey: "artistId" });
Collections.belongsToMany(TattooDesigns, {
  through: CollectionDesigns,
  foreignKey: "collectionId",
  otherKey: "designId",
  as: "designs",
});
TattooDesigns.belongsToMany(Collections, {
  through: CollectionDesigns,
  foreignKey: "designId",
  otherKey: "collectionId",
  as: "collections",
});
ArtistProfiles.hasMany(CommissionListing, { foreignKey: "artistId" });
CommissionListing.belongsTo(ArtistProfiles, { foreignKey: "artistId" });

// Clients
ClientProfiles.belongsTo(Users, { foreignKey: "userId" });
Users.hasOne(ClientProfiles, { foreignKey: "userId" });

ClientProfiles.belongsToMany(TattooDesigns, {
  through: ClientFavoriteDesigns,
  foreignKey: "clientId",
  otherKey: "designId",
  as: "favoriteDesigns",
});
TattooDesigns.belongsToMany(ClientProfiles, {
  through: ClientFavoriteDesigns,
  foreignKey: "designId",
  other: "clientId",
  as: "favoritedByClientsForDesigns",
});

ClientProfiles.belongsToMany(ArtistProfiles, {
  through: ClientFavoriteArtists,
  foreignKey: "clientId",
  otherKey: "artistId",
  as: "favoriteArtists",
});
ArtistProfiles.belongsToMany(ClientProfiles, {
  through: ClientFavoriteArtists,
  foreignKey: "artistId",
  other: "clientId",
  as: "favoritedByClientsForArtists",
});

module.exports = {
  db,
  Users,
  EmailPreference,
  TOSAgreement,
  ArtistProfiles,
  VerificationApplications,
  TattooDesigns,
  Collections,
  CollectionDesigns,
  CommissionListing,
  ClientProfiles,
  ClientFavoriteDesigns,
  ClientFavoriteArtists,
  CommissionOrders,
  CommissionReviews
};
