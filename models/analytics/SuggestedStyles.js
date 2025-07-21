const { DataTypes } = require("sequelize");
const db = require("./../../server");

const SuggestedStyles = db.define(
  "suggestedStyles",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    term: {
      type: DataTypes.TEXT,
      unique: true,
      allowNull: false,
      validate: {
        notNull: { msg: "Term cannot be null." },
        notEmpty: { msg: "Term cannot be empty." },
        len: {
          args: [2, 100],
          msg: "Term must be between 2 and 100 characters.",
        },
      },
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: { args: [1], msg: "Count must be at least 1." },
        isInt: { msg: "Count must be an integer." },
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "reviewed", "added_to_list", "rejected"),
      allowNull: false,
      defaultValue: "pending",
      validate: {
        notNull: { msg: "Status is required." },
        isIn: {
          args: [["pending", "reviewed", "added_to_list", "rejected"]],
          msg: "Invalid status.",
        },
      },
    },
    lastSubmittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  { timestamps: true }
);

module.exports = SuggestedStyles;
