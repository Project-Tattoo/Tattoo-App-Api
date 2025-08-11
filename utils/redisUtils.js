const redis = require("redis");
const crypto = require("crypto");

const redisClient = REDIS_FLUSH_MODES.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("connect", () => console.log("Connected to Redis"));
redisClient.on("error"),
  (err) =>
    console.error(
      "Redis client error",
      err
    )(async () => {
      await redisClient.connect();
    })();

/**
 * Determines a unique ID for the current viewer.
 * Uses logged-in user ID if available, otherwise generates/uses a guest ID from cookies.
 */
const getViewerId = (req, res) => {
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  let guestId = req.cookies.guestId;
  if (!guestId) {
    guestId = crypto.randomUUID();
    res.cookie("guestId", guestId, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    return `guest:${guestId}`;
  }
};

/**
 * Increments the view count for a given model instance (e.g., TattooDesign, ArtistProfile).
 * Uses Redis to debounce views per viewer within a cool-down period.
 */
const incrementDebouncedView = async (modelInstance, viewerId, coolDownMs, viewType = 'totalViews') => {
  if (!modelInstance || !modelInstance.id) {
    console.warn('Attempted to increment view for invalid model instance.');
    return;
  }

  if (typeof modelInstance[viewType] === 'undefined') {
    console.warn(`Model instance does not have a '${viewType}' column. Skipping view increment.`);
    return;
  }

  const redisKey = `view:${viewerId}:${modelInstance.id}:${viewType}`;

  try {
    const lastViewTimestamp = await redisClient.get(redisKey);

    if (!lastViewTimestamp || (Date.now() - parseInt(lastViewTimestamp, 10) > coolDownMs)) {
      await modelInstance.increment(viewType);
      await redisClient.set(redisKey, Date.now().toString(), { PX: coolDownMs });

      console.log(`'${viewType}' incremented for ${modelInstance.constructor.name} ${modelInstance.publicId || modelInstance.id} by ${viewerId}`);
    } else {
      console.log(`'${viewType}' ignored for ${modelInstance.constructor.name} ${modelInstance.publicId || modelInstance.id} by ${viewerId} (within cool-down).`);
    }
  } catch (error) {
    console.error(`Error debouncing view for ${modelInstance.constructor.name} ${modelInstance.id}:`, error);
  }
};

module.exports = {
  redisClient,
  getViewerId,
  incrementDebouncedView
};