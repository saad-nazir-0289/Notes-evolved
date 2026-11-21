import express from "express";
import User from "../model/user.js";
import authRateLimiter from "../middleware/authRateLimiter.js";
import { registerAuthRoutes } from "./registerAuthRoutes.js";

const router = express.Router();

export default registerAuthRoutes(router, User, { rateLimiter: authRateLimiter });
