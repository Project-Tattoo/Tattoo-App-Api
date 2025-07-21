const { DataTypes } = require("sequelize");
const db = require("./../../server");
const CommissionListings = require("./../artists/CommissionListing");
const ArtistProfiles = require("./../artists/ArtistProfiles");
const ClientProfiles = require("./../clients/ClientProfiles");

const CommissionOrders = db.define(
  "commissionOrders",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    listingId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: CommissionListings,
        key: "id",
      },
      onDelete: "SET NULL",
    },
    artistId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: ArtistProfiles,
        key: "userId",
      },
      onDelete: "SET NULL",
    },
    clientId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: ClientProfiles,
        key: "userId",
      },
      onDelete: "SET NULL",
    },
    agreedPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notNull: { msg: "Agreed price is required." },
        isDecimal: { msg: "Agreed price must be a decimal number." },
        min: { args: [0.01], msg: "Agreed price must be at least 0.01." },
      },
    },
    status: {
      type: DataTypes.ENUM(
        "pending_artist_acceptance",
        "accepted",
        "rejected_by_artist",
        "in_progress",
        "submitted_for_review",
        "completed",
        "cancelled_by_artist",
        "cancelled_by_client",
        "disputed"
      ),
      allowNull: false,
      defaultValue: "pending_artist_acceptance", 
      validate: {
        notNull: { msg: "Commission status is required." },
        isIn: {
          args: [
            [
              "pending_artist_acceptance",
              "accepted",
              "rejected_by_artist",
              "in_progress",
              "submitted_for_review",
              "completed",
              "cancelled_by_artist",
              "cancelled_by_client",
              "disputed",
            ],
          ],
          msg: "Invalid commission status.",
        },
      },
    },
    clientRequestDetails: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: { msg: "Client request details are required." },
        notEmpty: { msg: "Client request details cannot be empty." },
        len: {
          args: [10, 5000],
          msg: "Request details must be between 10 and 5000 characters.",
        }, 
      },
    },
    artistSubmissionUrl: {
      type: DataTypes.TEXT,
      allowNull: true, 
      validate: {
        isUrl: { msg: "Artist submission URL must be a valid URL." },
      },
    },
    artistSubmissionDate: {
      type: DataTypes.DATE, 
      allowNull: true, 
    },
    clientConfirmationDate: {
      type: DataTypes.DATE, 
      allowNull: true, 
    },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "paid", "refunded", "disputed"),
      allowNull: false,
      defaultValue: "pending",
      validate: {
        notNull: { msg: "Payment status is required." },
        isIn: {
          args: [["pending", "paid", "refunded", "disputed"]],
          msg: "Invalid payment status.",
        },
      },
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["listingId"], name: "idx_commission_orders_by_listing" },
      { fields: ["artistId"], name: "idx_commission_orders_by_artist" },
      { fields: ["clientId"], name: "idx_commission_orders_by_client" },
      { fields: ["status"], name: "idx_commission_orders_by_status" },
      {
        fields: ["paymentStatus"],
        name: "idx_commission_orders_by_payment_status",
      },
    ],
  }
);

module.exports = CommissionOrders;
