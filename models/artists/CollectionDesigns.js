const { DataTypes } = require("sequelize");
const db = require("./../../server");
const Collections = require("./Collections");
const TattooDesigns = require("./TattooDesigns");

const CollectionDesigns = db.define(
  "collectionDesigns",
  {
    collectionId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A collection design must be linked to a collection",
        },
      },
      references: {
        model: Collections,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    designId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A collection design must be linked to a design",
        },
      },
      references: {
        model: TattooDesigns,
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    timestamps: true,
    indexes: [
      { unique: true, fields: ['publicId'], name: 'artist_profiles_public_id_unique_idx' },
      { unique: true, fields: ['displayName'], name: 'artist_profiles_display_name_unique_idx' },
      { fields: ['userId'], name: 'artist_profiles_userid_idx' },
      { fields: ['commissionStatus'], name: 'artist_profiles_commission_status_idx' },
      { fields: ['isVerified'], name: 'artist_profiles_is_verified_idx' },
      { fields: ['city', 'state'], name: 'artist_profiles_city_state_idx' },
      { fields: ['stylesOffered'], using: 'GIN', name: 'artist_profiles_styles_offered_gin_idx' },
      { fields: ['totalCommissionsCompleted'], name: 'artist_profiles_total_commissions_completed_idx' },
      { fields: ['totalRevenueEarned'], name: 'artist_profiles_total_revenue_earned_idx' },
      { fields: ['averageRating'], name: 'artist_profiles_average_rating_idx' },
      { fields: ['totalReviews'], name: 'artist_profiles_total_reviews_idx' },
      { fields: ['totalViews'], name: 'artist_profiles_total_views_idx' },
      { fields: ['totalFollowers'], name: 'artist_profiles_total_followers_idx' },
      { fields: ['lastActivityAt'], name: 'artist_profiles_last_activity_at_idx' },
      { fields: ['searchVector'], using: 'GIN', name: 'artist_profiles_search_vector_idx' },
    ]
  }
);

module.exports = CollectionDesigns;
