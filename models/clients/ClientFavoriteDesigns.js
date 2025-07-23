const { DataTypes } = require("sequelize");
const db = require("./../../server");
const ClientProfiles = require("./ClientProfiles");
const TattooDesigns = require("./../artists/TattooDesigns");

const ClientFavoriteDesigns = db.define(
  "clientFavoriteDesigns",
  {
    clientId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A favorite must be linked to a client profile",
        },
      },
      references: {
        model: ClientProfiles,
        key: "userId",
      },
      onDelete: "CASCADE",
    },
    designId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A favorite must be linked to a design",
        },
      },
      references: {
        model: TattooDesigns,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    favoritedAt: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["clientId", "designId"],
      },
      {
        fields: ["clientId"],
        name: "idx_client_favorite_designs_by_client_id",
      },
      {
        fields: ["designId"],
        name: "idx_client_favorite_designs_by_design_id",
      },
      {
        fields: ["favoritedAt"],
        name: "client_favorite_designs_favorited_at_idx",
      },
    ],
  }
);

module.exports = ClientFavoriteDesigns;
