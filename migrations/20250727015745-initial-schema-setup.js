"use strict";
const { DataTypes } = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Users Table
    await queryInterface.createTable("users", {
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
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      passwordChangedAt: { type: DataTypes.DATE, allowNull: true },
      passwordResetToken: { type: DataTypes.STRING, allowNull: true },
      passwordResetExpires: { type: DataTypes.DATE, allowNull: true },
      role: {
        type: DataTypes.ENUM("artist", "client", "admin"),
        allowNull: false,
        defaultValue: "client",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      verifiedEmail: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      verifyToken: { type: DataTypes.STRING, allowNull: true },
      verifyExpires: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    // 2. Create EmailPreferences Table
    await queryInterface.createTable("emailPreferences", {
      userId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      marketingEmailsEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      notificationEmailsEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    // 3. Create TOSAgreements Table
    await queryInterface.createTable("tosAgreements", {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      tosVersion: { type: DataTypes.TEXT, allowNull: false },
      agreedAt: { type: DataTypes.DATE, allowNull: false },
      ipAddress: { type: DataTypes.TEXT, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addConstraint("tosAgreements", {
      fields: ["userId", "tosVersion"],
      type: "unique",
      name: "unique_user_tos_version",
    });

    // 4. Create ArtistProfiles Table
    await queryInterface.createTable("artistProfiles", {
      userId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      publicId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
      },
      displayName: { type: DataTypes.TEXT, unique: true, allowNull: false },
      bio: { type: DataTypes.TEXT, allowNull: true },
      commissionStatus: {
        type: DataTypes.ENUM("open", "closed", "byRequest"),
        allowNull: false,
        defaultValue: "closed",
      },
      stylesOffered: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: [],
      },
      paymentPlatformId: {
        type: DataTypes.TEXT,
        allowNull: true,
        unique: true,
      },
      socialMediaLinks: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      profilePictureUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "www.defaultpfp.com",
      },
      city: { type: DataTypes.STRING, allowNull: false },
      state: { type: DataTypes.STRING, allowNull: false },
      zipcode: { type: DataTypes.STRING, allowNull: false },
      location: { type: DataTypes.GEOGRAPHY("POINT"), allowNull: true },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      totalCommissionsCompleted: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      totalRevenueEarned: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: false,
      },
      currencyCode: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "USD",
      },
      averageRating: {
        type: DataTypes.DECIMAL(2, 1),
        defaultValue: 0.0,
        allowNull: false,
      },
      totalReviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      totalViews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      totalFollowers: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      lastActivityAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    // 5. Create VerificationApplications Table
    await queryInterface.createTable("verificationApplications", {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      artistId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: "artistProfiles", key: "userId" },
        onDelete: "CASCADE",
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM("Pending", "Approved", "Rejected", "Cancelled"),
        allowNull: false,
        defaultValue: "Pending",
      },
      reviewNotes: { type: DataTypes.TEXT, allowNull: true },
      rejectionReason: { type: DataTypes.TEXT, allowNull: true },
      supportingDocumentsUrl: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      reviewedAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addColumn(
      "artistProfiles",
      "currentVerificationApplicationId",
      {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: { model: "verificationApplications", key: "id" },
        onDelete: "SET NULL",
      }
    );

    // 6. Create TattooDesigns Table
    await queryInterface.createTable("tattooDesigns", {
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
        references: { model: "artistProfiles", key: "userId" },
        onDelete: "CASCADE",
      },
      title: { type: DataTypes.TEXT, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      imageUrl: { type: DataTypes.TEXT, allowNull: false },
      thumbnailUrl: { type: DataTypes.TEXT, allowNull: false },
      tags: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: [],
      },
      style: { type: DataTypes.STRING, allowNull: false },
      totalViews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      totalFavorites: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      totalShares: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    // 7. Create Collections Table
    await queryInterface.createTable("collections", {
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
        references: { model: "artistProfiles", key: "userId" },
        onDelete: "CASCADE",
      },
      name: { type: DataTypes.TEXT, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      totalViews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    // 8. Create CollectionDesigns Junction Table
    await queryInterface.createTable("collectionDesigns", {
      collectionId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: { model: "collections", key: "id" },
        onDelete: "CASCADE",
      },
      designId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: { model: "tattooDesigns", key: "id" },
        onDelete: "CASCADE",
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    // 9. Create CommissionListings Table
    await queryInterface.createTable("commissionListings", {
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
        references: { model: "artistProfiles", key: "userId" },
        onDelete: "CASCADE",
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue:
          "https://placehold.co/600x400/cccccc/333333?text=Commission+Image",
      },
      title: { type: DataTypes.TEXT, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      basePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      estimatedTimeToCompletion: { type: DataTypes.INTEGER, allowNull: false },
      slotsAvailable: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      totalViews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      totalInquiries: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    // 10. Create ClientProfiles Table
    await queryInterface.createTable("clientProfiles", {
      userId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      publicId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
      },
      displayName: { type: DataTypes.TEXT, allowNull: true },
      bio: { type: DataTypes.TEXT, allowNull: true },
      stripeCustomerId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      }, // Added stripeCustomerId
      totalViews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      lastActivityAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    // 11. Create ClientFavoriteDesigns Junction Table
    await queryInterface.createTable("clientFavoriteDesigns", {
      clientId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: { model: "clientProfiles", key: "userId" },
        onDelete: "CASCADE",
      },
      designId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: { model: "tattooDesigns", key: "id" },
        onDelete: "CASCADE",
      },
      favoritedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    // 12. Create ClientFavoriteArtists Junction Table
    await queryInterface.createTable("clientFavoriteArtists", {
      clientId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: { model: "clientProfiles", key: "userId" },
        onDelete: "CASCADE",
      },
      artistId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: { model: "artistProfiles", key: "userId" },
        onDelete: "CASCADE",
      },
      favoritedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    // 13. Create CommissionOrders Table
    await queryInterface.createTable("commissionOrders", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      listingId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: { model: "commissionListings", key: "id" },
        onDelete: "SET NULL",
      },
      artistId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: "artistProfiles", key: "userId" },
        onDelete: "CASCADE",
      },
      clientId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: "clientProfiles", key: "userId" },
        onDelete: "CASCADE",
      },
      agreedPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      status: {
        type: DataTypes.ENUM(
          "pending_artist_acceptance",
          "accepted",
          "rejected_by_artist",
          "in_progress",
          "submitted_for_review",
          "completed",
          "cancelled_by_artist",
          "cancelled_by_client",
          "disputed"
        ),
        allowNull: false,
        defaultValue: "pending_artist_acceptance",
      },
      clientRequestDetails: { type: DataTypes.TEXT, allowNull: false },
      artistSubmissionUrl: { type: DataTypes.TEXT, allowNull: true },
      artistSubmissionDate: { type: DataTypes.DATE, allowNull: true },
      clientConfirmationDate: { type: DataTypes.DATE, allowNull: true },
      paymentStatus: {
        type: DataTypes.ENUM("pending", "paid", "refunded", "disputed"),
        allowNull: false,
        defaultValue: "pending",
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    // 14. Create CommissionReviews Table
    await queryInterface.createTable("commissionReviews", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      commissionOrderId: {
        type: DataTypes.UUID,
        unique: true, // Ensures only one review per commission order
        allowNull: false,
        references: { model: "commissionOrders", key: "id" },
        onDelete: "CASCADE",
      },
      artistId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: "artistProfiles", key: "userId" },
        onDelete: "CASCADE",
      },
      clientId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: "clientProfiles", key: "userId" },
        onDelete: "CASCADE",
      },
      rating: { type: DataTypes.INTEGER, allowNull: false },
      reviewText: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    // 15. Create SuggestedStyles Table
    await queryInterface.createTable("suggestedStyles", {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      term: { type: DataTypes.TEXT, unique: true, allowNull: false },
      count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "reviewed",
          "added_to_list",
          "rejected"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      lastSubmittedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    // Users Indexes
    await queryInterface.addIndex("users", ["publicId"], {
      unique: true,
      name: "users_public_id_unique_idx",
    });
    await queryInterface.addIndex("users", ["email"], {
      unique: true,
      name: "users_email_unique_idx",
    });
    await queryInterface.addIndex("users", ["role"], {
      name: "users_role_idx",
    });
    await queryInterface.addIndex("users", ["isActive"], {
      name: "users_is_active_idx",
    });
    await queryInterface.addIndex("users", ["verifiedEmail"], {
      name: "users_verified_email_idx",
    });
    await queryInterface.addIndex("users", ["passwordResetToken"], {
      name: "users_password_reset_token_idx",
    });
    await queryInterface.addIndex("users", ["verifyToken"], {
      name: "users_verify_token_idx",
    });

    // EmailPreferences Indexes
    await queryInterface.addIndex("emailPreferences", ["userId"], {
      name: "email_preferences_userid_idx",
    });

    // TOSAgreements Indexes
    await queryInterface.addIndex("tosAgreements", ["userId"], {
      name: "tos_agreements_userid_idx",
    });
    await queryInterface.addIndex("tosAgreements", ["tosVersion"], {
      name: "tos_agreements_tos_version_idx",
    });
    await queryInterface.addIndex("tosAgreements", ["agreedAt"], {
      name: "tos_agreements_agreed_at_idx",
    });

    // ArtistProfiles Indexes
    await queryInterface.addIndex("artistProfiles", ["publicId"], {
      unique: true,
      name: "artist_profiles_public_id_unique_idx",
    });
    await queryInterface.addIndex("artistProfiles", ["displayName"], {
      unique: true,
      name: "artist_profiles_display_name_unique_idx",
    });
    await queryInterface.addIndex("artistProfiles", ["userId"], {
      name: "artist_profiles_userid_idx",
    });
    await queryInterface.addIndex("artistProfiles", ["commissionStatus"], {
      name: "artist_profiles_commission_status_idx",
    });
    await queryInterface.addIndex("artistProfiles", ["isVerified"], {
      name: "artist_profiles_is_verified_idx",
    });
    await queryInterface.addIndex("artistProfiles", ["city", "state"], {
      name: "artist_profiles_city_state_idx",
    });
    await queryInterface.addIndex("artistProfiles", ["stylesOffered"], {
      using: "GIN",
      name: "artist_profiles_styles_offered_gin_idx",
    }); // GIN for ARRAY
    await queryInterface.addIndex(
      "artistProfiles",
      ["totalCommissionsCompleted"],
      { name: "artist_profiles_total_commissions_completed_idx" }
    );
    await queryInterface.addIndex("artistProfiles", ["totalRevenueEarned"], {
      name: "artist_profiles_total_revenue_earned_idx",
    });
    await queryInterface.addIndex("artistProfiles", ["averageRating"], {
      name: "artist_profiles_average_rating_idx",
    });
    await queryInterface.addIndex("artistProfiles", ["totalReviews"], {
      name: "artist_profiles_total_reviews_idx",
    });
    await queryInterface.addIndex("artistProfiles", ["totalViews"], {
      name: "artist_profiles_total_views_idx",
    });
    await queryInterface.addIndex("artistProfiles", ["totalFollowers"], {
      name: "artist_profiles_total_followers_idx",
    });
    await queryInterface.addIndex("artistProfiles", ["lastActivityAt"], {
      name: "artist_profiles_last_activity_at_idx",
    });

    // VerificationApplications Indexes
    await queryInterface.addIndex("verificationApplications", ["artistId"], {
      name: "verification_applications_artist_id_idx",
    });
    await queryInterface.addIndex("verificationApplications", ["status"], {
      name: "verification_applications_status_idx",
    });
    await queryInterface.addIndex("verificationApplications", ["submittedAt"], {
      name: "verification_applications_submitted_at_idx",
    });
    await queryInterface.addIndex("verificationApplications", ["reviewedAt"], {
      name: "verification_applications_reviewed_at_idx",
    });

    // TattooDesigns Indexes
    await queryInterface.addIndex("tattooDesigns", ["publicId"], {
      unique: true,
      name: "tattoo_designs_public_id_unique_idx",
    });
    await queryInterface.addIndex("tattooDesigns", ["artistId"], {
      name: "tattoo_designs_artist_id_idx",
    });
    await queryInterface.addIndex("tattooDesigns", ["style"], {
      name: "tattoo_designs_style_idx",
    });
    await queryInterface.addIndex("tattooDesigns", ["totalViews"], {
      name: "tattoo_designs_total_views_idx",
    });
    await queryInterface.addIndex("tattooDesigns", ["totalFavorites"], {
      name: "tattoo_designs_total_favorites_idx",
    });
    await queryInterface.addIndex("tattooDesigns", ["totalShares"], {
      name: "tattoo_designs_total_shares_idx",
    });
    await queryInterface.addIndex("tattooDesigns", ["createdAt"], {
      name: "tattoo_designs_created_at_idx",
    });

    // Collections Indexes
    await queryInterface.addIndex("collections", ["publicId"], {
      unique: true,
      name: "collections_public_id_unique_idx",
    });
    await queryInterface.addIndex("collections", ["artistId"], {
      name: "collections_artist_id_idx",
    });
    await queryInterface.addIndex("collections", ["name"], {
      name: "collections_name_idx",
    });
    await queryInterface.addIndex("collections", ["totalViews"], {
      name: "collections_total_views_idx",
    });
    await queryInterface.addIndex("collections", ["createdAt"], {
      name: "collections_created_at_idx",
    });

    // CollectionDesigns Indexes
    await queryInterface.addIndex("collectionDesigns", ["collectionId"], {
      name: "collection_designs_collection_id_idx",
    });
    await queryInterface.addIndex("collectionDesigns", ["designId"], {
      name: "collection_designs_design_id_idx",
    });

    // CommissionListings Indexes
    await queryInterface.addIndex("commissionListings", ["publicId"], {
      unique: true,
      name: "commission_listings_public_id_unique_idx",
    });
    await queryInterface.addIndex("commissionListings", ["artistId"], {
      name: "commission_listings_artist_id_idx",
    });
    await queryInterface.addIndex("commissionListings", ["isActive"], {
      name: "commission_listings_is_active_idx",
    });
    await queryInterface.addIndex("commissionListings", ["basePrice"], {
      name: "commission_listings_base_price_idx",
    });
    await queryInterface.addIndex("commissionListings", ["totalViews"], {
      name: "commission_listings_total_views_idx",
    });
    await queryInterface.addIndex("commissionListings", ["totalInquiries"], {
      name: "commission_listings_total_inquiries_idx",
    });
    await queryInterface.addIndex("commissionListings", ["createdAt"], {
      name: "commission_listings_created_at_idx",
    });

    // ClientProfiles Indexes
    await queryInterface.addIndex("clientProfiles", ["publicId"], {
      unique: true,
      name: "client_profiles_public_id_unique_idx",
    });
    await queryInterface.addIndex("clientProfiles", ["userId"], {
      name: "client_profiles_userid_idx",
    });
    await queryInterface.addIndex("clientProfiles", ["displayName"], {
      name: "client_profiles_display_name_idx",
    });
    await queryInterface.addIndex("clientProfiles", ["stripeCustomerId"], {
      unique: true,
      name: "client_profiles_stripe_customer_id_unique_idx",
    });
    await queryInterface.addIndex("clientProfiles", ["totalViews"], {
      name: "client_profiles_total_views_idx",
    });
    await queryInterface.addIndex("clientProfiles", ["lastActivityAt"], {
      name: "client_profiles_last_activity_at_idx",
    });

    // ClientFavoriteDesigns Indexes
    await queryInterface.addIndex("clientFavoriteDesigns", ["clientId"], {
      name: "client_favorite_designs_client_id_idx",
    });
    await queryInterface.addIndex("clientFavoriteDesigns", ["designId"], {
      name: "client_favorite_designs_design_id_idx",
    });
    await queryInterface.addIndex("clientFavoriteDesigns", ["favoritedAt"], {
      name: "client_favorite_designs_favorited_at_idx",
    });

    // ClientFavoriteArtists Indexes
    await queryInterface.addIndex("clientFavoriteArtists", ["clientId"], {
      name: "client_favorite_artists_client_id_idx",
    });
    await queryInterface.addIndex("clientFavoriteArtists", ["artistId"], {
      name: "client_favorite_artists_artist_id_idx",
    });
    await queryInterface.addIndex("clientFavoriteArtists", ["favoritedAt"], {
      name: "client_favorite_artists_favorited_at_idx",
    });

    // CommissionOrders Indexes
    await queryInterface.addIndex("commissionOrders", ["listingId"], {
      name: "commission_orders_listing_id_idx",
    });
    await queryInterface.addIndex("commissionOrders", ["artistId"], {
      name: "commission_orders_artist_id_idx",
    });
    await queryInterface.addIndex("commissionOrders", ["clientId"], {
      name: "commission_orders_client_id_idx",
    });
    await queryInterface.addIndex("commissionOrders", ["status"], {
      name: "commission_orders_status_idx",
    });
    await queryInterface.addIndex("commissionOrders", ["paymentStatus"], {
      name: "commission_orders_payment_status_idx",
    });
    await queryInterface.addIndex("commissionOrders", ["createdAt"], {
      name: "commission_orders_created_at_idx",
    });

    // CommissionReviews Indexes
    await queryInterface.addIndex("commissionReviews", ["artistId"], {
      name: "commission_reviews_artist_id_idx",
    });
    await queryInterface.addIndex("commissionReviews", ["clientId"], {
      name: "commission_reviews_client_id_idx",
    });
    await queryInterface.addIndex("commissionReviews", ["rating"], {
      name: "commission_reviews_rating_idx",
    });
    await queryInterface.addIndex("commissionReviews", ["createdAt"], {
      name: "commission_reviews_created_at_idx",
    });

    // 1. Enable pg_trgm extension
    await queryInterface.sequelize.query(
      "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
    );

    // CRITICAL FIX: Create an immutable function for array to tsvector conversion
    // This explicitly tells PostgreSQL that the function's output is always the same for the same input,
    // satisfying the immutability requirement for GENERATED ALWAYS AS columns.
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION immutable_array_to_tsvector(config regconfig, arr text[])
      RETURNS tsvector LANGUAGE plpgsql IMMUTABLE AS $$
      BEGIN
        RETURN to_tsvector(config, coalesce(array_to_string(arr, ' '), ''));
      END;
      $$;
    `);

    // 2. ArtistProfiles TSVECTOR setup - Using the new immutable function
    await queryInterface.sequelize.query(`
      ALTER TABLE "artistProfiles" ADD COLUMN IF NOT EXISTS "searchVector" TSVECTOR
        GENERATED ALWAYS AS (
          setweight(to_tsvector('english'::regconfig, coalesce("displayName", '')), 'A') ||
          setweight(to_tsvector('english'::regconfig, coalesce("bio", '')), 'B') ||
          setweight(immutable_array_to_tsvector('english'::regconfig, "stylesOffered"), 'C') -- CRITICAL CHANGE: Using immutable_array_to_tsvector
        ) STORED;
    `);

    // 3. TattooDesigns TSVECTOR setup - Using the new immutable function
    await queryInterface.sequelize.query(`
      ALTER TABLE "tattooDesigns" ADD COLUMN IF NOT EXISTS "searchVector" TSVECTOR
        GENERATED ALWAYS AS (
          setweight(to_tsvector('english'::regconfig, coalesce("title", '')), 'A') ||
          setweight(to_tsvector('english'::regconfig, coalesce("description", '')), 'B') ||
          setweight(immutable_array_to_tsvector('english'::regconfig, "tags"), 'C') || -- CRITICAL CHANGE: Using immutable_array_to_tsvector
          setweight(to_tsvector('english'::regconfig, coalesce("style", '')), 'B')
        ) STORED;
    `);

    // 4. CommissionListings TSVECTOR setup (no change needed here as it doesn't use arrays)
    await queryInterface.sequelize.query(`
      ALTER TABLE "commissionListings" ADD COLUMN IF NOT EXISTS "searchVector" TSVECTOR
        GENERATED ALWAYS AS (
          setweight(to_tsvector('english'::regconfig, coalesce("title", '')), 'A') ||
          setweight(to_tsvector('english'::regconfig, coalesce("description", '')), 'B')
        ) STORED;
    `);

    // Add GIN indexes for TSVECTOR columns
    await queryInterface.addIndex("artistProfiles", ["searchVector"], {
      using: "GIN",
      name: "artist_profiles_search_vector_idx",
    });
    await queryInterface.addIndex("tattooDesigns", ["searchVector"], {
      using: "GIN",
      name: "tattoo_designs_search_vector_idx",
    });
    await queryInterface.addIndex("commissionListings", ["searchVector"], {
      using: "GIN",
      name: "commission_listings_search_vector_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      "artistProfiles",
      "artist_profiles_search_vector_idx"
    );
    await queryInterface.removeIndex(
      "tattooDesigns",
      "tattoo_designs_search_vector_idx"
    );
    await queryInterface.removeIndex(
      "commissionListings",
      "commission_listings_search_vector_idx"
    );

    await queryInterface.sequelize.query(
      'ALTER TABLE "artistProfiles" DROP COLUMN IF EXISTS "searchVector";'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "tattooDesigns" DROP COLUMN IF EXISTS "searchVector";'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "commissionListings" DROP COLUMN IF EXISTS "searchVector";'
    );

    await queryInterface.removeConstraint(
      "artistProfiles",
      "artistProfiles_currentVerificationApplicationId_fkey"
    );
    await queryInterface.removeColumn(
      "artistProfiles",
      "currentVerificationApplicationId"
    );

    await queryInterface.dropTable("suggestedStyles");
    await queryInterface.dropTable("commissionReviews");
    await queryInterface.dropTable("commissionOrders");
    await queryInterface.dropTable("clientFavoriteArtists");
    await queryInterface.dropTable("clientFavoriteDesigns");
    await queryInterface.dropTable("clientProfiles");
    await queryInterface.dropTable("commissionListings");
    await queryInterface.dropTable("collectionDesigns");
    await queryInterface.dropTable("collections");
    await queryInterface.dropTable("tattooDesigns");
    await queryInterface.dropTable("verificationApplications");
    await queryInterface.dropTable("artistProfiles");
    await queryInterface.dropTable("tosAgreements");
    await queryInterface.dropTable("emailPreferences");
    await queryInterface.dropTable("users");
  },
};
