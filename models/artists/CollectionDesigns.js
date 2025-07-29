const { DataTypes } = require("sequelize");
const db = require("./../../server");
const Collections = require("./Collections");
const TattooDesigns = require("./TattooDesigns");

const CollectionDesigns = db.define(
  "collectionDesigns",
  {
    collectionId: {
      type: DataTypes.BIGINT,
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
      type: DataTypes.BIGINT,
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
        fields: ['collectionId'],
        name: 'idx_collection_designs_collection_id' 
      },
      {
        fields: ['designId'],
        name: 'idx_collection_designs_design_id' 
      },
    ]
  }
);

module.exports = CollectionDesigns;
