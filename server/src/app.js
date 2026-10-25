import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import formRoutes from "./routes/form.routes.js";
import publicFormRoutes from "./routes/publicForm.routes.js";

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

app.use("/api/forms", formRoutes);
app.use("/api/public/forms", publicFormRoutes);

// Temporary endpoint to verify that the backend works.
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "FormGuard AI API is running"
    })
})

export default app;