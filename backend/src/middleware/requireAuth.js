import asyncHandler from "./asyncHandler.js";
import { verifyAccessToken } from "../utils/auth.js";

const unauthorized = () => Object.assign(new Error("Authentication required"), { status: 401 });

export const createRequireAuth = (User, { jwtSecret } = {}) => asyncHandler(async (req, _res, next) => {
  const authorization = req.headers?.authorization;
  const match = typeof authorization === "string"
    ? /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(authorization)
    : null;
  if (!match) throw unauthorized();

  const claims = verifyAccessToken(match[1], jwtSecret);
  if (!claims) throw unauthorized();

  const user = await User.findById(claims.sub);
  if (!user) throw unauthorized();

  req.user = {
    id: String(user._id ?? user.id),
    email: user.email,
  };
  return next();
});
