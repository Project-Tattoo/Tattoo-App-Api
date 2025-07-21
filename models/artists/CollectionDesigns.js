const Sequelize = require("sequelize");
const db = require("./../../server");
const Collections = require("./Collections");
const TattooDesigns = require("./TattooDesigns");

const CollectionDesigns = db.define(
  "collectionDesigns",
  {
    collectionId: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A collection design must be linked to a collection",
        },
      },
      references: {
        model: Collections,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    designId: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A collection design must be linked to a design",
        },
      },
      references: {
        model: TattooDesigns,
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["collectionId", "designId"],
      },
    ],
  }
);

module.exports = CollectionDesigns;
