import jwt from "jsonwebtoken"

export function requireAuth(req, res, next) {
    const token = req.cookies?.fg_session;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Please log in to continue",
        });
    }

    try {
        const secret = process.env.JWT_SECRET;

        if (!secret || secret.length < 32) {
            throw new Error("JWT_SECRET is not configured.");
        }

        const payload = jwt.verify(token, secret);

        if (
            typeof payload !== "object" ||
            typeof payload.sub !== "string"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token.",
            });
        }

        req.user = {
            id: payload.sub,
        };

        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Your session is invalid or has expired. Please log in again.",
        });
    }
}