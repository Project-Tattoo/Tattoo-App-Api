const { DataTypes } = require("sequelize");
const db = require("./../../server");
const ArtistProfiles = require("./ArtistProfiles");

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
        model: ArtistProfiles,
        key: "userId",
      },
      onDelete: 'CASCADE'
    },
    submittedAt: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected", "Cancelled"),
      allowNull: false,
    },
    reviewNotes: {
      type: DataTypes.TEXT,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
    },
    supportingDocumentsUrl: {
      type: DataTypes.JSONB,
    },
    reviewedAt: {
      type: DataTypes.DATEONLY,
    },
  },
  { timestamps: true }
);

module.exports = VerificationApplications