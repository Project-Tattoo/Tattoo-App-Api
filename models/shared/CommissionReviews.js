const { DataTypes } = require("sequelize");
const db = require("./../../server");
const CommissionOrders = require("./CommissionOrders");
const ArtistProfiles = require("./../artists/ArtistProfiles");
const ClientProfiles = require("./../clients/ClientProfiles");

const CommissionReviews = db.define(
  "commissionReviews",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    commissionOrderId: {
      type: DataTypes.UUID,
      unique: true, 
      allowNull: false,
      validate: {
        notNull: { msg: "A review must be linked to a commission order." },
      },
      references: {
        model: CommissionOrders,
        key: "id",
      },
      onDelete: "CASCADE", 
    },
    artistId: { 
      type: DataTypes.BIGINT, 
      allowNull: false,
      validate: {
        notNull: { msg: "Review must be linked to an artist." },
      },
      references: {
        model: ArtistProfiles,
        key: "userId",
      },
      onDelete: "CASCADE", 
    },
    clientId: { 
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        notNull: { msg: "Review must be linked to a client." },
      },
      references: {
        model: ClientProfiles,
        key: "userId",
      },
      onDelete: "SET NULL", 
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: "Rating is required." },
        isInt: { msg: "Rating must be an integer." },
        min: { args: [0], msg: "Rating must be at least 0." },
        max: { args: [5], msg: "Rating must be at most 5." },
      },
    },
    reviewText: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: { args: [0, 2000], msg: "Review text cannot exceed 2000 characters." }
      }
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ['commissionOrderId'], name: 'idx_commission_reviews_by_order' },
      { fields: ['artistId'], name: 'idx_commission_reviews_by_artist' }, 
      { fields: ['clientId'], name: 'idx_commission_reviews_by_client' }  
    ]
  }
);

module.exports = CommissionReviews;