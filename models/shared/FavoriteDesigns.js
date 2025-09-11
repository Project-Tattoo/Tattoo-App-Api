const { DataTypes } = require("sequelize");
const db = require("./../../server");
const Users = require("./../shared/Users");
const TattooDesigns = require("./../artists/TattooDesigns");

const FavoriteDesigns = db.define(
  "favoriteDesigns",
  {
    userId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A favorite must be linked to a profile",
        },
      },
      references: {
        model: Users,
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
        fields: ["userId", "designId"],
        name: "unique_user_design_favorite",
      },
      {
        fields: ["userId"],
        name: "idx_user_favorite_designs_by_id",
      },
      {
        fields: ["designId"],
        name: "idx_user_favorite_designs_by_design_id",
      },
      {
        fields: ["favoritedAt"],
        name: "user_favorite_designs_favorited_at_idx",
      },
    ],
    hooks: {
      afterCreate: async (favorite, options) => {
        await TattooDesigns.increment("totalFavorites", {
          where: { id: favorite.designId },
          transaction: options.transaction,
        });
      },
      beforeDestroy: async (favorite, options) => {
        options.designId = favorite.designId;
      },
      afterDestroy: async (favorite, options) => {
        await TattooDesigns.decrement("totalFavorites", {
          where: { id: options.designId },
          transaction: options.transaction,
        });
      },
    },
  }
);

module.exports = FavoriteDesigns;
