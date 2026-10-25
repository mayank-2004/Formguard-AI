import mongoose from "mongoose";
import { parse, success, z } from "zod"
import Form from "../models/Form.js";
import Submission from "../models/Submission.js";
import { submissionPayloadSchema } from "../validators/submission.validator.js";
import { evaluateConsistencyRules } from "../services/ruleEngine.js";

export async function getPublishedForm(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid form ID",
            });
        }

        const form = await Form.findOne({
            _id: id,
            status: "published",
        }).select("title description fields status");

        if (!form) {
            return res.status(400).json({
                success: false,
                message: "Form not found or is not published.",
            });
        }
        return res.status(200).json({
            success: true,
            data: form,
        });
    } catch (error) {
        console.error("Get published form failed: ", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to load this form.",
        });
    }
}

export async function createSubmission(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid form ID",
            });
        }

        const parsed = submissionPayloadSchema.safeParse(req.body);
        console.log("parsed data: ", parsed)

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid submission format.",
            });
        }

        const form = await Form.findOne({
            _id: id,
            status: "published",
        });

        if (!form) {
            return res.status(400).json({
                success: false,
                message: "Form not found or is not published.",
            });
        }

        const answers = parsed.data.answers;
        console.log("answers: ", answers);
        const allowedIds = new Set(
            form.fields.map((field) => field.fieldId)
        );

        const unknownIds = Object.keys(answers).filter(
            (fieldId) => !allowedIds.has(fieldId)
        );

        if (unknownIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Submission contains unknown question IDs.",
            });
        }

        const fieldErrors = [];
        const normalizedAnswers = []

        function addError(fieldId, message) {
            fieldErrors[fieldId] = message;
        }

        function isValidDateOnly(value) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return false;
            }

            const date = new Date(`${value}T00:00:00.000Z`);

            return (
                !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
            );
        }

        for (const field of form.fields) {
            const rawValue = answers[field.fieldId];
            let value;

            if (field.type === "checkbox") {
                value = rawValue === undefined ? false : rawValue;

                if (typeof value !== "boolean") {
                    addError(field.fieldId, "Invalid checkbox value.")
                } else if (field.required && !value) {
                    addError(field.fieldId, "This checkbox must be selected.");
                }
            } else {
                value = rawValue ?? "";

                const validInputType =
                    typeof value === "string" ||
                    (field.type === "number" && typeof value === "number");

                if (!validInputType) {
                    addError(field.fieldId, "Invalid answer type.");
                    continue;
                }

                if (typeof value === "string") {
                    value = value.trim();
                }

                if (value === "" && field.required) {
                    addError(field.fieldId, "This question is required.");
                    continue;
                }

                if (typeof value === "string" && value.length > 5000) {
                    addError(field.fieldId, "Answer must not exceed 5000 characters.");
                    continue;
                }

                if (value !== "" && field.type === "number") {
                    const numberValue = Number(value);

                    if (
                        (typeof value === "string" && value.trim() === "") ||
                        !Number.isFinite(numberValue)
                    ) {
                        addError(field.fieldId, "Enter a valid number.");
                        continue;
                    }

                    value = numberValue;
                }

                if (value !== "" && field.type === "email") {
                    const result = z.string().email().safeParse(value);

                    if (!result.success) {
                        addError(field.fieldId, "Enter a valid email address.");
                        continue;
                    }
                }

                if (
                    value !== "" &&
                    field.type === "date" &&
                    !isValidDateOnly(value)
                ) {
                    addError(field.fieldId, "Enter a valid date.");
                    continue;
                }

                if (
                    value !== "" &&
                    ["select", "radio"].includes(field.type) &&
                    !field.options.includes(value)
                ) {
                    addError(
                        field.fieldId,
                        "Select one of the available options."
                    );
                    continue;
                }
            }

            normalizedAnswers.push({
                fieldId: field.fieldId,
                label: field.label,
                type: field.type,
                value,
            });
        }

        if (Object.keys(fieldErrors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Please correct the highlighted answers.",
            });
        }

        const answerValues = Object.fromEntries(
            normalizedAnswers.map((answer) => [
                answer.fieldId,
                answer.value,
            ])
        );

        const issues = evaluateConsistencyRules(form, answerValues);

        const blockingIssues = issues.filter((issue) => issue.blocking);

        if (blockingIssues.length > 0) {
            return res.status(400).json({
                success: false,
                message: blockingIssues[0].message,
                errors: Object.fromEntries(
                    blockingIssues.map((issue) => [
                        issue.fieldIds[1],
                        issue.message,
                    ])
                ),
            });
        }

        // Only non-blocking warnings can be confirmed and submitted.
        const warnings = issues.filter((issue) => !issue.blocking);

        if (warnings.length > 0 && !parsed.data.confirmed) {
            return res.status(200).json({
                success: true,
                data: {
                    requiresConfirmation: true,
                    message: "Potential inconsistencies were found. Review them before submitting.",
                    issues: warnings,
                },
            });
        }

        const submission = await Submission.create({
            formId: form._id,
            formTitle: form.title,
            answers: normalizedAnswers,
            issues: warnings,
            validationStatus: warnings.length > 0 ? "needs_review" : "no_issues",
        });

        return res.status(201).json({
            success: true,
            message: "Your submission was received successfully.",
            data: {
                id: submission._id,
                submittedAt: submission.createdAt,
            },
        });
    } catch (error) {
        console.error("Create submission failed: ", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to submit your answers.",
        });
    }
}