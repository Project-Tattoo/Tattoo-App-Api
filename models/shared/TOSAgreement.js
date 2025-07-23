const { DataTypes } = require("sequelize");
const db = require("../../server");
const Users = require("./Users");

const TOSAgreement = db.define(
  "tosAgreements",
  {
    userId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A tos agreement must be linked to a user",
        },
      },
      references: {
        model: Users,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    tosVersion: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: { msg: "TOS version is required." },
      },
    },
    agreedAt: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notNull: { msg: "Agreement date is required." },
        isDate: { msg: "Agreement date must be a valid date." },
      },
    },
    ipAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: { msg: "IP address is required." },
        isIP: { msg: "Invalid IP address format." },
      },
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["userId"], name: "tos_agreements_userid_idx" },
      { fields: ["tosVersion"], name: "tos_agreements_tos_version_idx" },
      { fields: ["agreedAt"], name: "tos_agreements_agreed_at_idx" },
      { fields: ["ipAddress"], name: "tos_agreements_ip_address_idx" },
    ],
  }
);

module.exports = TOSAgreement;
