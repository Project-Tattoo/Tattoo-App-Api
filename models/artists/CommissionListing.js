const { DataTypes } = require("sequelize");
const db = require("./../../server");
const ArtistDetails = require("./ArtistDetails");

const CommissionListing = db.define(
  "commissionListings",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
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
        model: ArtistDetails,
        key: "userId",
      },
      onDelete: "CASCADE",
    },
    publicId: { 
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, 
      unique: true, 
      allowNull: false,
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
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "www.defaultcommissionimage.com",
      validate: {
        isUrl: { msg: "Image must be a valid URL." },
      },
    },
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notNull: {
          msg: "A commission must have a price",
        },
        isDecimal: true,
        min: 0.01,
      },
    },
    estimatedTimeToCompletion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Must provide a timeframe for completion",
        },
        min: 1,
        isInt: true,
      },
    },
    slotsAvailable: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Must provide a number of slots, if no longer accepting at this time, please set to zero or turn off commissions",
        },
        min: 0,
        isInt: true
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
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
    totalInquiries: { 
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: { min: 0, isInt: true } 
    },
  },
  { timestamps: true,
    indexes: [
      { unique: true, fields: ['publicId'], name: 'commission_listings_public_id_unique_idx' },
      { fields: ['artistId'], name: 'commission_listings_artist_id_idx' },
      { fields: ['isActive'], name: 'commission_listings_is_active_idx' },
      { fields: ['basePrice'], name: 'commission_listings_base_price_idx' },
      { fields: ['totalViews'], name: 'commission_listings_total_views_idx' },
      { fields: ['totalInquiries'], name: 'commission_listings_total_inquiries_idx' },
      { fields: ['createdAt'], name: 'commission_listings_created_at_idx' },
      { fields: ['searchVector'], using: 'GIN', name: 'commission_listings_search_vector_idx' },
    ]
   }
);

module.exports = CommissionListing;
