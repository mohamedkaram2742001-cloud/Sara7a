import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import geoip from "geoip-lite";
import { redisClient } from "../DB/index.js";
export const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: (req) => {
    const geo = geoip.lookup(req.ip);
    const country = geo?.country;
    return country == "EG" ? 10 : 3;
  },
  standardHeaders: true,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const ipV6 = ipKeyGenerator(req.headers["x-forwarded-for"], 56) || req.ip;
    return `${ipV6}-${req.path}`;
  },
  store: {
    async incr(key, cb) { // get called by keyGenerator
      try {
        const count = await redisClient.incr(key);
        if (count === 1) await redisClient.expire(key, 120);
        cb(null, count);
      } catch (err) {
        cb(err);
      }
    },
    async resetKey(key) { // called by await limiter.store.resetKey(key)
      await redisClient.del(key);
    },
    async decrement(key) { // called by skipfailedRequest: true ||  skipSuccessfulRequest : true
      if (await redisClient.exists(key)) {
        await redisClient.decr(key);
      }
    },
  },
});
