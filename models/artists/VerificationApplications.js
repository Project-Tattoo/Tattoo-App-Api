const { DataTypes } = require("sequelize");
const db = require("./../../server");
const ArtistDetails = require("./ArtistDetails");

const VerificationApplications = db.define(
  "verificationApplications",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    artistId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        notNull: {
          msg: "An application must be linked to an artist",
        },
      },
      references: {
        model: ArtistDetails,
        key: "userId",
      },
      onDelete: "CASCADE",
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected", "Cancelled"),
      allowNull: false,
      defaultValue: "Pending",
      validate: {
        notNull: { msg: "Status is required." },
        isIn: {
          args: [["Pending", "Approved", "Rejected", "Cancelled"]],
          msg: "Invalid status. Must be 'Pending', 'Approved', 'Rejected', or 'Cancelled'.",
        },
      },
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      validate: {
        len: {
          args: [0, 2000],
          msg: "Review notes cannot exceed 2000 characters.",
        },
      },
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      validate: {
        len: {
          args: [0, 2000],
          msg: "Rejection reason cannot exceed 2000 characters.",
        },
      },
    },
    supportingDocumentsUrl: {
      type: DataTypes.JSONB,
      validate: {
        isUrlArray(value) {
          if (!Array.isArray(value)) {
            throw new Error("Supporting documents must be an array.");
          }
          for (const item of value) {
            if (
              typeof item !== "string" ||
              item.trim().length === 0 ||
              !/^https?:\/\/\S+$/.test(item)
            ) {
              throw new Error("All supporting documents must be valid URLs.");
            }
          }
        },
        maxItems: {
          args: [10],
          msg: "Cannot upload more than 10 supporting documents.",
        },
      },
    },
    reviewedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["artistId"], name: "verification_applications_artist_id_idx" },
      { fields: ["status"], name: "verification_applications_status_idx" },
      {
        fields: ["submittedAt"],
        name: "verification_applications_submitted_at_idx",
      },
      {
        fields: ["reviewedAt"],
        name: "verification_applications_reviewed_at_idx",
      },
    ],
  }
);

module.exports = VerificationApplications;
