import express from "express"
import { getSubmissions, getSubmissionById, getSubmissionStats } from "../controllers/submission.controller.js";

const router = express.Router();

// keep /stats above /:id so it is matched as a named endpoint.
router.get("/stats", getSubmissionStats);
router.get("/", getSubmissions);
router.get("/:id", getSubmissionById);

export default router;