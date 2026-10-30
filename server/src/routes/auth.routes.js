import express from "express"
import rateLimit from "express-rate-limit"
import { register, login, logout, getCurrentUser } from "../controllers/auth.controller.js"
import { requireAuth } from "../middleware/requireAuth.js"

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Please try again later.",
    },
});

router.post("/register", register)
router.post("/login", loginLimiter, login)
router.post("/logout", logout)
router.get("/me", requireAuth ,getCurrentUser)

export default router;