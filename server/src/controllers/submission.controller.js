import mongoose, { Aggregate } from "mongoose";
import { z } from "zod"
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

// Parse and limit pagination values received from the URL.
function getPagination(req) {
    const page = Math.max(
        1, Number.parseInt(req.query.page, 100) || 1
    );

    const limit = Math.min(
        50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    return {
        page, limit, skip: (page - 1) * limit,
    };
}

// Escape user-provided search text before using it in a regular expression.
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/submissions
// Return a paginated list of submissions.
export async function getSubmissions(req, res) {
    try {
        const { page, limit, skip } = getPagination(req);
        const filter = {}

        const status = String(req.query.status || "")
        const allowedStatuses = [
            "needs_review",
            "no_issues",
            "not_checked",
        ];

        if (status && status !== "all") {
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid submission status filter.",
                });
            }
            filter.validationStatus = status;
        }

        const search = String(req.query.q || "").trim().slice(0, 100);

        if (search) {
            filter.formTitle = {
                $regex: escapeRegex(search),
                $options: "i",
            };
        }

        const [items, total] = await Promise.all([
            Submission.find(filter)
                .select("formId formTitle validationStatus issues createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Submission.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error("Get submissions failed: ", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve submissions.",
        });
    }
}

// GET /api/submissions/:id
// Return the answers and warnings for one submission.
export async function getSubmissionById(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid submission ID.",
            });
        }

        const submission = await Submission.findById(id).lean();

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: submission,
        });
    } catch (error) {
        console.error("Get submissions details failed: ", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve submission details.",
        });
    }
}

// GET /api/submissions/stats
// Calculate the statistics displayed on the dashboard.
export async function getSubmissionStats(req, res) {
    try {
        const [
            totalSubmissions,
            needsReview,
            noIssues,
            notChecked,
            submissionsWithIssues,
        ] = await Promise.all([
            Submission.countDocuments(),

            Submission.countDocuments({
                validationStatus: "needs_review",
            }),

            Submission.countDocuments({
                validationStatus: "no_issues",
            }),

            Submission.countDocuments({
                validationStatus: "not_checked",
            }),

            // Retrieve only the issue arrays instead of using aggregation.
            Submission.find({})
                .select("issues -_id")
                .lean(),
        ]);

        // Count all stored issue records.
        const totalIssues = submissionsWithIssues.reduce(
            (total, submission) =>
                total + (submission.issues?.length || 0),
            0
        );

        return res.status(200).json({
            success: true,
            data: {
                totalSubmissions,
                needsReview,
                noIssues,
                notChecked,
                totalIssues,
            },
        });
    } catch (error) {
        // Log the full error for easier debugging.
        console.error("Get submission stats failed:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve submission statistics.",
        });
    }
}

// GET /api/forms/:id/submissions
// Return submissions belonging to one specific form.
export async function getSubmissionsForForm(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid form ID.",
            });
        }

        const form = await Form.findById(id).select("_id");

        if (!form) {
            return res.status(404).json({
                success: false,
                message: "Form not found",
            });
        }

        const { page, limit, skip } = getPagination(req);
        const filter = { formId: id };

        const [items, total] = await Promise.all([
            Submission.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Submission.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error("Get form submissions failed: ", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve this form's submissions."
        })
    }
}