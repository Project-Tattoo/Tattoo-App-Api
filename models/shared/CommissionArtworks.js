const { DataTypes } = require("sequelize");
const db = require("../../server");
const CommissionOrders = require("./CommissionOrders");
const CommissionReviews = require("./CommissionReviews");
const Users = require("./Users");

const CommissionArtworks = db.define(
  "commissionArtworks",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    publicId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false,
    },
    commissionOrderId: {
      type: DataTypes.BIGINT,
      unique: true,
      allowNull: false,
      references: {
        model: CommissionOrders,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    providerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: Users,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    artworkUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        isUrl: { msg: "Artwork URL must be a valid URL." },
      },
    },
    reviewId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: CommissionReviews,
        key: "id",
      },
      onDelete: "SET NULL",
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    totalViews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
        isInt: true,
      },
    },
    totalFavorites: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        isInt: true,
      },
    },
    madePublicAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["providerId"], name: "commission_artworks_provider_id_idx" },
      { fields: ["isPublic"], name: "commission_artworks_is_public_idx" },
    ],
  }
);

module.exports = CommissionArtworks