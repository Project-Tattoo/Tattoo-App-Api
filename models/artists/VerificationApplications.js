const Sequelize = require("sequelize");
const db = require("./../../server");
const ArtistProfiles = require("./ArtistProfiles");

const VerificationApplications = db.define(
  "verificationApplications",
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    artistId: {
      type: Sequelize.BIGINT,
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
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM("Pending", "Approved", "Rejected", "Cancelled"),
      allowNull: false,
    },
    reviewNotes: {
      type: Sequelize.TEXT,
    },
    rejectionReason: {
      type: Sequelize.TEXT,
    },
    supportingDocumentsUrl: {
      type: Sequelize.JSONB,
    },
    reviewedAt: {
      type: Sequelize.DATEONLY,
    },
  },
  { timestamps: true }
);

module.exports = VerificationApplications