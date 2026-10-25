import mongoose from "mongoose";
import { string } from "zod";

const answerSchema = new mongoose.Schema(
    {
        fieldId: {
            type: String,
            required: true,
        },
        label: {
            type: String,
            rrequired: true,
        },
        type: {
            type: String,
            required: true,
            enum: [
                "text",
                "textarea",
                "number",
                "email",
                "date",
                "select",
                "radio",
                "checkbox",
            ],
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            default: "",
        },
    },
    { _id: false }
);

const issueSchema = new mongoose.Schema(
    {
        ruleId: {
            type: String,
            required: true,
        },

        type: {
            type: String,
            required: true,
            enum: ["required_if", "conflicts_with", "date_order"],
        },

        fieldIds: {
            type: [String],
            default: [],
        },

        severity: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },

        message: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

const submissionSchema = new mongoose.Schema(
    {
        formId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Form",
            required: true,
            index: true,
        },
        formTitle: {
            type: String,
            required: true,
        },
        answers: {
            type: [answerSchema],
            default: [],
        },
        validationStatus: {
            type: String,
            enum: ["not_checked", "needs_review", "no_issues"],
            default: "not_checked",
        },
        issues: {
            type: [issueSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const Submission = mongoose.models.Submission || mongoose.model("Submission", submissionSchema);

export default Submission;