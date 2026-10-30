import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import formRoutes from "./routes/form.routes.js";
import publicFormRoutes from "./routes/publicForm.routes.js";
import submissionRoutes from "./routes/submission.routes.js";
import cookieParser from "cookie-parser"
import authRoutes from "./routes/auth.routes.js"
import { requireAuth } from "./middleware/requireAuth.js";

const app = express();

app.use(helmet());

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use(
    "/api",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
    })
);

// Authentication endpoints are available before login.
app.use("/api/auth", authRoutes);

// Respondents can access published forms without signing in.
app.use("/api/public/forms", publicFormRoutes);

// Management APIs require an authenticated user.
app.use("/api/forms", requireAuth, formRoutes);
app.use("/api/submissions", requireAuth, submissionRoutes);

// Temporary endpoint to verify that the backend works.
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "FormGuard AI API is running"
    })
})

export default app;