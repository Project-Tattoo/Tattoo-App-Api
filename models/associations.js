const db = require("./../server");
const Users = require("./shared/Users");
const EmailPreference = require("./shared/EmailPreferences");
const TOSAgreement = require("./shared/TOSAgreement");
const ArtistDetails = require("./artists/ArtistDetails");
const VerificationApplications = require("./artists/VerificationApplications");
const TattooDesigns = require("./artists/TattooDesigns");
const Collections = require("./artists/Collections");
const CollectionDesigns = require("./artists/CollectionDesigns");
const CommissionListing = require("./artists/CommissionListing");
const FavoriteDesigns = require("./shared/FavoriteDesigns");
const FavoriteArtists = require("./shared/ClientFavoriteArtists");
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
  allowNull: true,
});
Users.hasMany(CommissionOrders, {
  foreignKey: "providerId",
  sourceKey: "id",
  onDelete: "SET NULL",
});
Users.hasMany(CommissionOrders, {
  foreignKey: "recipientId",
  sourceKey: "id",
  onDelete: "SET NULL",
});
CommissionOrders.belongsTo(Users, {
  foreignKey: "providerId",
  targetKey: "id",
});
CommissionOrders.belongsTo(Users, {
  foreignKey: "recipientId",
  targetKey: "id",
});
CommissionOrders.belongsTo(CommissionListing, {
  foreignKey: "listingId",
  targetKey: "id",
});
Users.hasMany(CommissionReviews, {
  foreignKey: "providerId",
  sourceKey: "id",
  onDelete: "CASCADE",
  as: "commissionReviewsReceived",
});
Users.hasMany(CommissionReviews, {
  foreignKey: "recipientId",
  sourceKey: "id",
  onDelete: "CASCADE",
  as: "commissionReviewsGiven",
});
CommissionReviews.belongsTo(Users, {
  foreignKey: "providerId",
  targetKey: "id",
});
CommissionReviews.belongsTo(Users, {
  foreignKey: "recipientId",
  targetKey: "id",
});

// Artists
ArtistDetails.belongsTo(Users, { foreignKey: "userId" });
Users.hasOne(ArtistDetails, { foreignKey: "userId" });
ArtistDetails.hasMany(VerificationApplications, { foreignKey: "artistId" });
VerificationApplications.belongsTo(ArtistDetails, { foreignKey: "artistId" });
ArtistDetails.hasMany(TattooDesigns, { foreignKey: "artistId" });
TattooDesigns.belongsTo(ArtistDetails, { foreignKey: "artistId" });
ArtistDetails.hasMany(Collections, { foreignKey: "artistId" });
Collections.belongsTo(ArtistDetails, { foreignKey: "artistId" });
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
ArtistDetails.hasMany(CommissionListing, { foreignKey: "artistId" });
CommissionListing.belongsTo(ArtistDetails, { foreignKey: "artistId" });

// Shared
Users.belongsToMany(TattooDesigns, {
  through: FavoriteDesigns,
  foreignKey: "userId",
  otherKey: "designId",
  as: "favoriteDesigns",
});

TattooDesigns.belongsToMany(Users, {
  through: FavoriteDesigns,
  foreignKey: "designId",
  otherKey: "userId",
  as: "favoritedByUsersForDesigns",
});

Users.belongsToMany(ArtistDetails, {
  through: FavoriteArtists,
  foreignKey: "userId",
  otherKey: "artistId",
  as: "favoriteArtists",
});

ArtistDetails.belongsToMany(Users, {
  through: FavoriteArtists,
  foreignKey: "artistId",
  otherKey: "userId",
  as: "favoritedByClientsForArtists",
});

module.exports = {
  db,
  Users,
  EmailPreference,
  TOSAgreement,
  ArtistDetails,
  VerificationApplications,
  TattooDesigns,
  Collections,
  CollectionDesigns,
  CommissionListing,
  FavoriteDesigns,
  FavoriteArtists,
  CommissionOrders,
  CommissionReviews,
};
