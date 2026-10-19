import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema(
    {
        fieldId: {
            type: String,
            required: true,
            trim: true,
        },
        label: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
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
        required: {
            type: Boolean,
            default: false,
        },
        options: {
            type: [String],
            default: [],
        },
    },
    { _id: false }
);

const formSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 1000,
        },
        fields: {
            type: [fieldSchema],
            default: [],
        },
        status: {
            type: String,
            enum: ["draft", "published"],
            default: "draft",
        },
    },
    {
        timestamps: true,
    }
);

const Form = mongoose.model("form", formSchema) || mongoose.models.Form;

export default Form;
