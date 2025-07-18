const { DataTypes } = require("sequelize");
import { define } from "./../../server";
import ClientProfiles from "./ClientProfiles";
import TattooDesigns from "./../artists/TattooDesigns";
import { Client } from "pg";

const ClientFavoriteDesigns = define(
  "clientFavoriteDesigns",
  {
    clientId: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.INTEGER,
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
    ],
  }
);

module.exports = ClientFavoriteDesigns;
