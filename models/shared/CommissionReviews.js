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
      type: DataTypes.BIGINT,
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
        len: {
          args: [0, 2000],
          msg: "Review text cannot exceed 2000 characters.",
        },
      },
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["commissionOrderId"],
        name: "commission_reviews_order_id_unique_idx",
      },
      { fields: ["artistId"], name: "commission_reviews_artist_id_idx" },
      { fields: ["clientId"], name: "commission_reviews_client_id_idx" },
      { fields: ["rating"], name: "commission_reviews_rating_idx" },
      { fields: ["createdAt"], name: "commission_reviews_created_at_idx" },
    ],
  }
);

module.exports = CommissionReviews;
