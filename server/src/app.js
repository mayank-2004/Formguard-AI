import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

app.use(helmet());

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json({ limit: "1mb" }));

app.use(
    "/api",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
    })
);

// Temporary endpoint to verify that the backend works.
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "FormGuard AI API is running"
    })
})

export default app;