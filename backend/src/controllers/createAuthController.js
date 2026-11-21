import { randomBytes } from "node:crypto";
import asyncHandler from "../middleware/asyncHandler.js";
import { getJwtSecret } from "../config/auth.js";
import { hashPassword, signAccessToken, verifyPassword } from "../utils/auth.js";
import { successResponse } from "../utils/apiResponse.js";

const conflict = () => Object.assign(new Error("An account with this email already exists"), { status: 409 });
const invalidCredentials = () => Object.assign(new Error("Invalid email or password"), { status: 401 });

const toPublicUser = (user) => {
  const id = user?._id ?? user?.id;
  if (!id) throw new Error("User record is missing its id");
  return { id: String(id), email: user.email };
};

export const createAuthController = (User, { jwtSecret } = {}) => {
  let dummyPasswordHashPromise;
  const getDummyPasswordHash = () => {
    dummyPasswordHashPromise ??= hashPassword(randomBytes(32).toString("hex"));
    return dummyPasswordHashPromise;
  };

  return {
    register: asyncHandler(async (req, res) => {
      const secret = getJwtSecret(jwtSecret);
      const { email, password } = req.authCredentials;

      if (await User.exists({ email })) throw conflict();

      const passwordHash = await hashPassword(password);
      const user = await User.create({ email, passwordHash });
      const publicUser = toPublicUser(user);
      const token = signAccessToken(publicUser.id, secret);

      return res.status(201).json(successResponse("Account created successfully", {
        token,
        user: publicUser,
      }));
    }),

    login: asyncHandler(async (req, res) => {
      const secret = getJwtSecret(jwtSecret);
      const { email, password } = req.authCredentials;
      const user = await User.findOne({ email }).select("+passwordHash");
      const passwordHash = user?.passwordHash ?? await getDummyPasswordHash();
      const passwordMatches = await verifyPassword(password, passwordHash);

      if (!user || !passwordMatches) throw invalidCredentials();

      const publicUser = toPublicUser(user);
      const token = signAccessToken(publicUser.id, secret);

      return res.status(200).json(successResponse("Login successful", {
        token,
        user: publicUser,
      }));
    }),
  };
};
