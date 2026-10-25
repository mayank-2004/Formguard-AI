import mongoose from "mongoose";

// Defines the structure of each question in a form.
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

// Defines the consistency rules configured by form creators.
const consistencyRuleSchema = new mongoose.Schema(
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

    sourceFieldId: {
      type: String,
      required: true,
    },

    sourceValue: {
      type: String,
      default: "",
    },

    targetFieldId: {
      type: String,
      required: true,
    },

    targetValue: {
      type: String,
      default: "",
    },

    message: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },
  },
  { _id: false }
);

// Defines the complete form document stored in MongoDB.
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

    consistencyRules: {
      type: [consistencyRuleSchema],
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

// Prevents registering the same model more than once.
const Form =
  mongoose.models.Form || mongoose.model("Form", formSchema);

export default Form;
