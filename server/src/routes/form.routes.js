import express from "express";
import { createForm, getForms, getFormById, updateForm, deleteForm } from "../controllers/form.controller.js";

const router = express.Router();

router.get("/", getForms);
router.post("/", createForm);
router.get("/:id", getFormById);
router.put("/:id", updateForm);
router.delete("/:id", deleteForm);

export default router;