const { DataTypes } = require("sequelize");
const db = require("./../../server");
const CommissionListings = require("./../artists/CommissionListing");
const Users = require("./Users")

const CommissionOrders = db.define(
  "commissionOrders",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    listingId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: CommissionListings,
        key: "id",
      },
      onDelete: "SET NULL",
    },
    providerId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: Users,
        key: "id",
      },
      onDelete: "SET NULL",
    },
    recipientId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: Users,
        key: "id",
      },
      onDelete: "SET NULL",
    },
    orderId: { 
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, 
      unique: true, 
      allowNull: false,
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
    recipientRequestDetails: {
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
    providerSubmissionUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        isUrl: { msg: "Artist submission URL must be a valid URL." },
      },
    },
    providerSubmissionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    recipientConfirmationDate: {
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
      { fields: ["listingId"], name: "commission_orders_listing_id_idx" },
      { fields: ["providerId"], name: "commission_orders_provider_id_idx" },
      { fields: ["recipientId"], name: "commission_orders_recipient_id_idx" },
      { fields: ["status"], name: "commission_orders_status_idx" },
      { fields: ["paymentStatus"], name: "commission_orders_payment_status_idx" },
      { fields: ['createdAt'], name: 'commission_orders_created_at_idx' },
    ]
  }
);
module.exports = CommissionOrders;

