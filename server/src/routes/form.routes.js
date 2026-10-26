import express from "express";
import { createForm, getForms, getFormById, updateForm, deleteForm } from "../controllers/form.controller.js";
import { getSubmissionsForForm } from "../controllers/submission.controller.js";

const router = express.Router();

router.get("/", getForms);
router.post("/", createForm);
router.get("/:id/submissions", getSubmissionsForForm);
router.get("/:id", getFormById);
router.put("/:id", updateForm);
router.delete("/:id", deleteForm);

export default router;