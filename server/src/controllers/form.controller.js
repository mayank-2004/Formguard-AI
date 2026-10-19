import mongoose from "mongoose";
import Form from "../models/Form.js";
import { formPayloadSchema } from "../validators/form.validator.js";
import { success } from "zod";

function validateFormPayload(body, res) {
    const result = formPayloadSchema.safeParse(body);
    console.log("result", result);

    if(!result.success) {
        res.status(400).json({
            success: false,
            message: 
                result.error.issues[0]?.message || "Invalid form payload.",
            errors: result.error.flatten(),
        });
        return null;
    }
    return result.data;
}

// create a new form
export async function createForm(req, res) {
    try {
        const payload = validateFormPayload(req.body, res);

        if (!payload) return;

        const form  = await Form.create(payload);

        return res.status(201).json({
            success: true,
            message: "Form created successfully",
            data: form,
        });
    } catch (error) {
        console.error("Error creating form:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to create the form.",
        });
    }
}

// Retrieve all forms
export async function getForms(req, res) {
    try {
        const forms = await Form.find().sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Forms retireved successfully",
            data: forms,
        });
    } catch (error) {
        console.error("Get forms failed ", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve forms.",
        });
    }
}

// Retrieve one form
export async function getFormById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid form ID",
            });
        }

        const form = await Form.findById(id);

        if (!form) {
            return res.status(404).json({
                success: false,
                message: "Form not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: form,
        });
    } catch (error) {
        console.error("Get form failed: ", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve the form",
        });
    }
}

// Update an existing form
export async function updateForm(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid form ID",
            });
        }

        const payload = validateFormPayload(req.body, res);

        if (!payload) return;

        const form = await Form.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });

        if (!form) {
            return res.status(404).json({
                success: false,
                message: "Form not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Form updated successfully",
            data: form,
        });
    } catch (error) {
        console.error("Update form failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update the form.",
        });
    }
}

// Delete a form
export async function deleteForm(req, res) {
    try {
        const { id } = req.params;

        if(!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid form ID",
            });
        }

        const form = await Form.findByIdAndDelete(id);

        if (!form) {
            return res.status(404).json({
                success: false,
                message: "Form not found.",
            });
        }

        return res.status(200).json({
            success: false,
            message: "Form deleted successfully.",
        });
    } catch (error) {
        console.error("Form delete failed: ", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete the form",
        });
    }
}