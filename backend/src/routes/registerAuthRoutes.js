import { createAuthController } from "../controllers/createAuthController.js";
import { validateAuthCredentials } from "../middleware/authValidation.js";
import { createRequireAuth } from "../middleware/requireAuth.js";
import { successResponse } from "../utils/apiResponse.js";

export const registerAuthRoutes = (router, User, { jwtSecret, rateLimiter } = {}) => {
  const options = { jwtSecret };
  const { register, login } = createAuthController(User, options);
  const requireAuth = createRequireAuth(User, options);
  const authHandlers = (validate, handler) => [
    ...(rateLimiter ? [rateLimiter] : []),
    validate,
    handler,
  ];

  router.post("/register", ...authHandlers(validateAuthCredentials({ registration: true }), register));
  router.post("/login", ...authHandlers(validateAuthCredentials(), login));
  router.get("/me", requireAuth, (req, res) => (
    res.status(200).json(successResponse("Current user found", req.user))
  ));

  return router;
};
