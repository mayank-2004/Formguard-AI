import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js";

import { registerSchema, loginSchema } from "../validators/auth.validator.js";

const COOKIE_NAME = "fg_session";
const SESSION_DURATION = 7 * 24 * 60 * 1000;

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error("JWT_SECRET must be configured with a strong random secret.");
    }

    return secret;
}

function getCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_DURATION,
    };
}

function createToken(userId) {
    return jwt.sign(
        { sub: userId.toString() },
        getJwtSecret(),
        { expiresIn: "7d" }
    );
}

function publicUser(user) {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
    };
}

// Register a new user and establish a session.
export async function register(req, res) {
    try {
        const secret = getJwtSecret();
        const parsed = registerSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Please check your registration details.",
                errors: parsed.error.flatten(),
            });
        }

        const { name, email, password } = parsed.data;

        if (Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({
                success: false,
                message: "Password must not exceed 72 UTF-8 bytes.",
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({
            name,
            email,
            passwordHash,
        });

        const token = jwt.sign(
            { sub: user._id.toString() },
            secret,
            { expiresIn: "7d" }
        );

        res.cookie(COOKIE_NAME, token, getCookieOptions());

        return res.status(201).json({
            success: true,
            message: "Account created successfully.",
            data: {
                user: publicUser(user),
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
        }

        console.error("Registration failed: ", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to register your account.",
        });
    }
}

// Authenticat an existing user.
export async function login(req, res) {
    try {
        getJwtSecret();

        const parsed = loginSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email and password.",
            });
        }

        const { email, password } = parsed.data;
        const user = await User.findOne({ email }).select("+passwordHash");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const matches = await bcrypt.compare(
            password, user.passwordHash
        );

        if (!matches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const token = createToken(user._id);

        res.cookie(COOKIE_NAME, token, getCookieOptions());

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            data: {
                user: publicUser(user),
            },
        });
    } catch (error) {
        console.error("Login failed: ", error.message)

        return res.status(500).json({
            success: false,
            message: "Unable to log in.",
        });
    }
}

// Clear the authentication cookie.
export function logout(req, res) {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully.",
        data: null,
    });
}

// Retrieve the profile for the authenticated user.
export async function getCurrentUser(req, res) {
    try {
        const user = await User.findById(req.user.id).select(
            "_id name email createdAt"
        );

        if (!user) {
            res.clearCookie(COOKIE_NAME, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
            });

            return res.status(401).json({
                success: false,
                message: "Your session is no longer valid.",
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                user: publicUser(user),
            },
        });
    } catch (error) {
        console.error("Get current user failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve the current user.",
        });
    }
}