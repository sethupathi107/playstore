import express from "express";
import authentication from "../controller/auth.js"
import authValidators from "../utils/validators/auth.js";
import validateRequest from "../utils/validateRequest.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post("/signup", authValidators.signupValidator, validateRequest, authentication.signup);
router.post("/signin", authValidators.signinValidator, validateRequest, authentication.signin);
router.post("/refresh-token", authValidators.refreshTokenValidator, validateRequest, authentication.refreshToken);
router.post("/logout", authValidators.refreshTokenValidator, validateRequest, authentication.logout);
router.post("/logout-all", authValidators.refreshTokenValidator, validateRequest, authentication.logoutAll);
router.post("/forgot-password", authValidators.forgotPasswordValidator, validateRequest, authentication.forgotPassword);
router.post("/reset-password", authValidators.resetPasswordValidator, validateRequest, authentication.resetPassword);
router.delete("/delete-account", auth, authValidators.deleteAccountValidator, validateRequest, authentication.deleteAccount);

export default router;

// /signup and /signin issue an accessToken + refreshToken pair.
// /refresh-token exchanges a valid refreshToken for a new accessToken.
// /logout clears only the refreshToken sent in; /logout-all clears every refreshToken for that user.
// /forgot-password issues a short-lived resetToken; /reset-password consumes it to set a new password
// and, as a side effect, signs the user out of every device.
