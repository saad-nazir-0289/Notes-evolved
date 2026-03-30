import ratelimit from "../config/upstash.js";

const rateLimiter = async (req, res, next) => {
    try {
        const result = await ratelimit.limit(req.ip || "global")
        if (!result.success) {
            return res.status(429).json({ message: "Too many requests" })
        }
        next()
    } catch (error) {
        res.status(500).json({ message: "Error in rate limiting" })
    }
}

export default rateLimiter