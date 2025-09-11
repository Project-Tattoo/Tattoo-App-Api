const db = require("./../server");
const Users = require("./shared/Users");
const EmailPreference = require("./shared/EmailPreferences");
const TOSAgreement = require("./shared/TOSAgreement");
const ArtistDetails = require("./artists/ArtistDetails");
const VerificationApplications = require("./artists/VerificationApplications");
const TattooDesigns = require("./artists/TattooDesigns");
const PortfolioCollections = require("./artists/PortfolioCollections");
const CollectionDesigns = require("./artists/CollectionDesigns");
const CommissionListing = require("./artists/CommissionListing");
const FavoriteDesigns = require("./shared/FavoriteDesigns");
const FavoriteArtists = require("./shared/FavoriteArtists");
const CommissionOrders = require("./shared/CommissionOrders");
const CommissionReviews = require("./shared/CommissionReviews");
const Notifications = require("./../models/shared/Notifications");
const CommissionArtworks = require("./../models/shared/CommissionArtworks");

// Shared
Users.hasMany(Notifications, { foreignKey: "userId" });
Notifications.belongsTo(Users, { foreignKey: "userId" });
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

CommissionOrders.hasOne(CommissionArtworks, {
  foreignKey: "commissionOrderId",
  onDelete: "CASCADE",
});
CommissionArtworks.belongsTo(CommissionOrders, {
  foreignKey: "commissionOrderId",
});

Users.hasMany(CommissionArtworks, {
  foreignKey: "providerId",
  as: "providedArtworks",
});
CommissionArtworks.belongsTo(Users, {
  foreignKey: "providerId",
  as: "provider",
});

Users.hasMany(CommissionArtworks, {
  foreignKey: "recipientId",
  as: "receivedArtworks",
});
CommissionArtworks.belongsTo(Users, {
  foreignKey: "recipientId",
  as: "recipient",
});

CommissionReviews.hasOne(CommissionArtworks, {
  foreignKey: "reviewId",
  onDelete: "SET NULL",
});
CommissionArtworks.belongsTo(CommissionReviews, { foreignKey: "reviewId" });

// Artists
ArtistDetails.belongsTo(Users, { foreignKey: "userId" });
Users.hasOne(ArtistDetails, { foreignKey: "userId" });
ArtistDetails.hasMany(VerificationApplications, { foreignKey: "artistId" });
VerificationApplications.belongsTo(ArtistDetails, { foreignKey: "artistId" });
ArtistDetails.hasMany(TattooDesigns, { foreignKey: "artistId" });
TattooDesigns.belongsTo(ArtistDetails, { foreignKey: "artistId" });
ArtistDetails.hasMany(PortfolioCollections, { foreignKey: "artistId" });
PortfolioCollections.belongsTo(ArtistDetails, { foreignKey: "artistId" });
PortfolioCollections.belongsToMany(TattooDesigns, {
  through: CollectionDesigns,
  foreignKey: "collectionId",
  otherKey: "designId",
  as: "designs",
});
TattooDesigns.belongsToMany(PortfolioCollections, {
  through: CollectionDesigns,
  foreignKey: "designId",
  otherKey: "collectionId",
  as: "Portfoliocollections",
});
ArtistDetails.hasMany(CommissionListing, { foreignKey: "artistId" });
CommissionListing.belongsTo(ArtistDetails, { foreignKey: "artistId" });

// Shared
Users.belongsToMany(TattooDesigns, {
  through: FavoriteDesigns,
  foreignKey: "userId",
  otherKey: "designId",
  as: "usersFavoritedDesigns",
});

TattooDesigns.belongsToMany(Users, {
  through: FavoriteDesigns,
  foreignKey: "designId",
  otherKey: "userId",
  as: "favoritedByUsersForDesigns",
});

FavoriteDesigns.belongsTo(Users, {
  foreignKey: "userId",
  as: "fan",
});

FavoriteDesigns.belongsTo(TattooDesigns, {
  foreignKey: "designId",
  as: "design",
});

FavoriteArtists.belongsTo(Users, {
  foreignKey: "userId",
  as: "fan", 
});

FavoriteArtists.belongsTo(Users, {
  foreignKey: "artistId",
  as: "artist",
});

Users.belongsToMany(Users, {
  through: FavoriteArtists,
  foreignKey: "userId",
  otherKey: "artistId",
  as: "usersFavoritedArtists",
});

Users.belongsToMany(Users, {
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
  PortfolioCollections,
  CollectionDesigns,
  CommissionListing,
  FavoriteDesigns,
  FavoriteArtists,
  CommissionOrders,
  CommissionReviews,
  Notifications,
  CommissionArtworks,
};
