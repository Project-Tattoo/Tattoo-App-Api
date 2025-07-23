const { DataTypes } = require("sequelize");
const db = require("./../../server");
const ArtistProfiles = require("./ArtistProfiles");

const TattooDesigns = db.define(
  "tattooDesigns",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    publicId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
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
      onDelete: "CASCADE",
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A design must have a title",
        },
        len: {
          args: [3, 100],
          msg: "Title must be between 3 and 100 characters.",
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 2000],
          msg: "Description cannot exceed 2000 characters.",
        },
      },
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A design must have an image",
        },
        isUrl: { msg: "Image URL must be a valid URL." },
      },
    },
    thumbnailUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A design must have a thumbnail image",
        },
        isUrl: { msg: "Thumbnail URL must be a valid URL." },
      },
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
      validate: {
        isStringArray(value) {
          if (!Array.isArray(value)) {
            throw new Error("Tags must be an array.");
          }
          for (const item of value) {
            if (typeof item !== "string" || item.trim().length === 0) {
              throw new Error("All tags must be non-empty strings.");
            }
          }
        },
        maxTags: {
          args: [20],
          msg: "Cannot add more than 20 tags.",
        },
      },
    },
    style: {
      type: DataTypes.STRING, 
      allowNull: false, 
      validate: {
        notNull: { msg: "Design style is required." },
        notEmpty: { msg: "Design style cannot be empty." },
        len: {
          
          args: [2, 50], 
          msg: "Style name must be between 2 and 50 characters.",
        },
      },
    },
    searchVector: {
      type: DataTypes.TSVECTOR,
      allowNull: true, 
    },
    totalViews: { 
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: { min: 0, isInt: true } 
    },
    totalFavorites: { 
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: { min: 0, isInt: true } 
    },
    totalShares: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: { min: 0, isInt: true }
    },
  },
  { timestamps: true,
    indexes: [
      { unique: true, fields: ['publicId'], name: 'tattoo_designs_public_id_unique_idx' },
      { fields: ['artistId'], name: 'tattoo_designs_artist_id_idx' },
      { fields: ['style'], name: 'tattoo_designs_style_idx' },
      { fields: ['totalViews'], name: 'tattoo_designs_total_views_idx' },
      { fields: ['totalFavorites'], name: 'tattoo_designs_total_favorites_idx' },
      { fields: ['totalShares'], name: 'tattoo_designs_total_shares_idx' },
      { fields: ['createdAt'], name: 'tattoo_designs_created_at_idx' },
      { fields: ['searchVector'], using: 'GIN', name: 'tattoo_designs_search_vector_idx' },
    ]
   }
);

module.exports = TattooDesigns;
