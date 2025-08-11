"use strict";
const { DataTypes } = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
    );

    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION immutable_array_to_tsvector(config regconfig, arr text[])
      RETURNS tsvector LANGUAGE plpgsql IMMUTABLE AS $$
      BEGIN
        RETURN to_tsvector(config, coalesce(array_to_string(arr, ' '), ''));
      END;
      $$;
    `);

    ////////////////////////// USERS //////////////////////////
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
      stripeCustomerId: { type: DataTypes.STRING, allowNull: false },
      displayName: { type: DataTypes.STRING, allowNull: false, unique: true },
      bio: { type: DataTypes.TEXT, allowNull: true },
      socialMediaLinks: { type: DataTypes.JSONB, allowNull: true },
      profilePictureUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "www.defaultpfp.com",
      },
      searchVector: { type: DataTypes.TSVECTOR, allowNull: true },
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
      passwordChangedAt: { type: DataTypes.DATE, allowNull: true },
      passwordResetToken: { type: DataTypes.STRING, allowNull: true },
      passwordResetExpires: { type: DataTypes.DATE, allowNull: true },
      role: {
        type: DataTypes.ENUM("artist", "user", "admin"),
        allowNull: false,
        defaultValue: "user",
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
      lastActivityAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

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
    await queryInterface.addIndex("users", ["displayName"], {
      name: "users_profiles_display_name_unique_idx",
    });
    await queryInterface.addIndex("users", ["totalViews"], {
      name: "user_profiles_total_views_idx",
    });
    await queryInterface.addIndex("users", ["lastActivityAt"], {
      name: "user_profiles_last_activity_at_idx",
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "searchVector" TSVECTOR
        GENERATED ALWAYS AS (
          setweight(to_tsvector('english'::regconfig, coalesce("displayName", '')), 'A') ||
          setweight(to_tsvector('english'::regconfig, coalesce("bio", '')), 'B')
        ) STORED;
    `);

    await queryInterface.addIndex("users", ["searchVector"], {
      using: "GIN",
      name: "users_search_vector_idx",
    });

    ////////////////////////// EMAILPREFERENCES //////////////////////////
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

    await queryInterface.addIndex("emailPreferences", ["userId"], {
      name: "email_preferences_userid_idx",
    });

    ////////////////////////// TOSAGREEMENTS //////////////////////////
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

    await queryInterface.addIndex("tosAgreements", ["userId"], {
      name: "tos_agreements_userid_idx",
    });
    await queryInterface.addIndex("tosAgreements", ["tosVersion"], {
      name: "tos_agreements_tos_version_idx",
    });
    await queryInterface.addIndex("tosAgreements", ["agreedAt"], {
      name: "tos_agreements_agreed_at_idx",
    });

    ////////////////////////// ARTISTDETAILS //////////////////////////
    await queryInterface.createTable("artistDetails", {
      userId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
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
        ltValue: "www.defaultpfp.com",
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
      searchVector: { type: DataTypes.TSVECTOR, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.addIndex("artistDetails", ["userId"], {
      name: "artist_details_userid_idx",
    });
    await queryInterface.addIndex("artistDetails", ["commissionStatus"], {
      name: "artist_details_commission_status_idx",
    });
    await queryInterface.addIndex("artistDetails", ["isVerified"], {
      name: "artist_details_is_verified_idx",
    });
    await queryInterface.addIndex("artistDetails", ["city", "state"], {
      name: "artist_details_city_state_idx",
    });
    await queryInterface.addIndex("artistDetails", ["stylesOffered"], {
      using: "GIN",
      name: "artist_details_styles_offered_gin_idx",
    });
    await queryInterface.addIndex(
      "artistDetails",
      ["totalCommissionsCompleted"],
      { name: "artist_details_total_commissions_completed_idx" }
    );
    await queryInterface.addIndex("artistDetails", ["totalRevenueEarned"], {
      name: "artist_Details_total_revenue_earned_idx",
    });
    await queryInterface.addIndex("artistDetails", ["averageRating"], {
      name: "artist_details_average_rating_idx",
    });
    await queryInterface.addIndex("artistDetails", ["totalReviews"], {
      name: "artist_details_total_reviews_idx",
    });
    await queryInterface.addIndex("artistDetails", ["searchVector"], {
      using: "GIN",
      name: "artist_details_search_vector_idx",
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE "artistDetails" ADD COLUMN IF NOT EXISTS "searchVector" TSVECTOR
        GENERATED ALWAYS AS (
          setweight(to_tsvector('english', coalesce(NEW."city", '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW."state", '')), 'A') ||
          setweight(to_tsvector('english', array_to_string(NEW."stylesOffered", ' ')), 'B') ||
          setweight(to_tsvector('english', coalesce(NEW."averageRating"::text, '')), 'C')
        ) STORED;
    `);

    ////////////////////////// VERIFICATIONAPPLICATIONS //////////////////////////
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
        references: { model: "artistDetails", key: "userId" },
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
      "artistDetails",
      "currentVerificationApplicationId",
      {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: { model: "verificationApplications", key: "id" },
        onDelete: "SET NULL",
      }
    );

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

    ////////////////////////// TATTOODESIGNS //////////////////////////
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
        references: { model: "artistDetails", key: "userId" },
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

    await queryInterface.sequelize.query(`
      ALTER TABLE "tattooDesigns" ADD COLUMN IF NOT EXISTS "searchVector" TSVECTOR
        GENERATED ALWAYS AS (
          setweight(to_tsvector('english'::regconfig, coalesce("title", '')), 'A') ||
          setweight(to_tsvector('english'::regconfig, coalesce("description", '')), 'B') ||
          setweight(immutable_array_to_tsvector('english'::regconfig, "tags"), 'C') || -- CRITICAL CHANGE: Using immutable_array_to_tsvector
          setweight(to_tsvector('english'::regconfig, coalesce("style", '')), 'B')
        ) STORED;
    `);

    await queryInterface.addIndex("tattooDesigns", ["searchVector"], {
      using: "GIN",
      name: "tattoo_designs_search_vector_idx",
    });

    ////////////////////////// PORTFOLIOCOLLECTIONS //////////////////////////
    await queryInterface.createTable("portfolioCollections", {
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
        references: { model: "artistDetails", key: "userId" },
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

    ////////////////////////// COLLECTIONDESIGNS //////////////////////////
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

    await queryInterface.addIndex("collectionDesigns", ["collectionId"], {
      name: "collection_designs_collection_id_idx",
    });
    await queryInterface.addIndex("collectionDesigns", ["designId"], {
      name: "collection_designs_design_id_idx",
    });

    ////////////////////////// COLLECTIONLISTINGS //////////////////////////
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
        references: { model: "artistDetails", key: "userId" },
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

    ////////////////////////// FAVORITEDESIGNS //////////////////////////
    await queryInterface.createTable("favoriteDesigns", {
      userId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: { model: "users", key: "id" },
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
    await queryInterface.addIndex("favoriteDesigns", ["userId", "designId"], {
      name: "unique_user_design_favorite",
    });
    await queryInterface.addIndex("favoriteDesigns", ["userId"], {
      name: "idx_user_favorite_designs_by_id",
    });
    await queryInterface.addIndex("favoriteDesigns", ["designId"], {
      name: "idx_user_favorite_designs_by_design_id",
    });
    await queryInterface.addIndex("favoriteDesigns", ["favoritedAt"], {
      name: "user_favorite_designs_favorited_at_idx",
    });

    ////////////////////////// FAVORITEARTISTS //////////////////////////
    await queryInterface.createTable("favoriteArtists", {
      userId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      artistId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
        references: { model: "users", key: "id" },
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
    await queryInterface.addIndex("favoriteArtists", ["userId", "artistId"], {
      name: "unique_user_artist_favorite",
    });
    await queryInterface.addIndex("favoriteArtists", ["userId"], {
      name: "favorite_artists_users_id_idx",
    });
    await queryInterface.addIndex("favoriteArtists", ["artistId"], {
      name: "user_favorite_artists_artist_id_idx",
    });
    await queryInterface.addIndex("favoriteArtists", ["favoritedAt"], {
      name: "users_favorite_artists_favorited_at_idx",
    });

    ////////////////////////// COMMISSIONORDERS //////////////////////////
    await queryInterface.createTable("commissionOrders", {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      listingId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: { model: "commissionListings", key: "id" },
        onDelete: "SET NULL",
      },
      providerId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      recipientId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: "users", key: "id" },
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
      recipientRequestDetails: { type: DataTypes.TEXT, allowNull: false },
      providerSubmissionUrl: { type: DataTypes.TEXT, allowNull: true },
      providerSubmissionDate: { type: DataTypes.DATE, allowNull: true },
      recipientConfirmationDate: { type: DataTypes.DATE, allowNull: true },
      paymentStatus: {
        type: DataTypes.ENUM("pending", "paid", "refunded", "disputed"),
        allowNull: false,
        defaultValue: "pending",
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.addIndex("commissionOrders", ["listingId"], {
      name: "commission_orders_listing_id_idx",
    });
    await queryInterface.addIndex("commissionOrders", ["providerId"], {
      name: "commission_orders_provider_id_idx",
    });
    await queryInterface.addIndex("commissionOrders", ["recipientId"], {
      name: "commission_orders_recipient_id_idx",
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

    ////////////////////////// COMMISSIONREVIEWS //////////////////////////
    await queryInterface.createTable("commissionReviews", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      commissionOrderId: {
        type: DataTypes.BIGINT,
        unique: true,
        allowNull: false,
        references: { model: "commissionOrders", key: "id" },
        onDelete: "CASCADE",
      },
      providerId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      recipientId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      rating: { type: DataTypes.INTEGER, allowNull: false },
      reviewText: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.addIndex("commissionReviews", ["providerId"], {
      name: "commission_reviews_provider_id_idx",
    });
    await queryInterface.addIndex("commissionReviews", ["recipientId"], {
      name: "commission_reviews_recipient_id_idx",
    });
    await queryInterface.addIndex("commissionReviews", ["rating"], {
      name: "commission_reviews_rating_idx",
    });
    await queryInterface.addIndex("commissionReviews", ["createdAt"], {
      name: "commission_reviews_created_at_idx",
    });

    ////////////////////////// COLLECTIONARTWORKS //////////////////////////

    await queryInterface.createTable("commissionArtworks", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      publicId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
        allowNull: false,
      },
      commissionOrderId: {
        type: Sequelize.BIGINT,
        unique: true,
        allowNull: false,
        references: {
          model: "commissionOrders",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      providerId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      artworkUrl: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      reviewId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "commissionReviews",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      totalViews: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      totalFavorites: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      madePublicAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("commissionArtworks", ["providerId"], {
      name: "commission_artworks_provider_id_idx",
    });
    await queryInterface.addIndex("commissionArtworks", ["isPublic"], {
      name: "commission_artworks_is_public_idx",
    });

    ////////////////////////// NOTIFICATIONS //////////////////////////

    await queryInterface.createTable("notifications", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      notificationType: {
        type: DataTypes.ENUM(
          "new_message",
          "commission_received",
          "commission_completed",
          "commission_status_update",
          "design_favorited",
          "profile_favorited",
          "commission_order_placed",
          "system_alert"
        ),
        defaultValue: "system_alert",
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("notifications", ["userId"], {
      name: "notifications_user_id_idx",
    });

    ////////////////////////// SUGGESTEDSTYLES //////////////////////////
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

    await queryInterface.sequelize.query(`
      ALTER TABLE "commissionListings" ADD COLUMN IF NOT EXISTS "searchVector" TSVECTOR
        GENERATED ALWAYS AS (
          setweight(to_tsvector('english'::regconfig, coalesce("title", '')), 'A') ||
          setweight(to_tsvector('english'::regconfig, coalesce("description", '')), 'B')
        ) STORED;
    `);

    await queryInterface.addIndex("commissionListings", ["searchVector"], {
      using: "GIN",
      name: "commission_listings_search_vector_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("suggestedStyles");
    await queryInterface.dropTable("commissionReviews");
    await queryInterface.dropTable("commissionOrders");
    await queryInterface.dropTable("favoriteArtists");
    await queryInterface.dropTable("favoriteDesigns");
    await queryInterface.dropTable("commissionListings");
    await queryInterface.dropTable("collectionDesigns");
    await queryInterface.dropTable("collections");
    await queryInterface.dropTable("tattooDesigns");
    await queryInterface.dropTable("verificationApplications");
    await queryInterface.dropTable("artistDetails");
    await queryInterface.dropTable("tosAgreements");
    await queryInterface.dropTable("emailPreferences");
    await queryInterface.dropTable("users");
    await queryInterface.dropTable("notifications");
    await queryInterface.dropTable("commissionArtworks");
  },
};
