import express from "express"
import { getPublishedForm, createSubmission } from "../controllers/submission.controller.js";

const router = express.Router();

router.get("/:id", getPublishedForm);
router.post("/:id/submissions", createSubmission);

export default router;