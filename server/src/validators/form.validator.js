import { z } from "zod";

const fieldSchema = z.object({
    fieldId: z.string().trim().min(1).max(100),
    label: z.string().trim().min(1).max(100),
    type: z.enum([
        "text",
        "textarea",
        "number",
        "email",
        "date",
        "select",
        "radio",
        "checkbox",
    ]),
    required: z.boolean().default(false),
    options: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
})
.superRefine((field, context) => {
    console.log("field", field);
    const isChoiceField = ["select", "radio"].includes(field.type);
    if(isChoiceField && field.options.length < 2) {
        context.addIssue({
            code: "custom",
            path: ["options"],
            message: "Add at least two options to this question.",
        });
    }

    if (isChoiceField) {
        const normalizedOptions = field.options.map((option) => option.toLocaleLowerCase());

        if(new Set(normalizedOptions).size !== normalizedOptions.length) {
            context.addIssue({
                code: "custom",
                path: ["options"],
                message: "Question options must be unique.",
            });
        }
    }

    if(!isChoiceField && field.options.length > 0) {
        context.addIssue({
            code: "custom",
            path: ["options"],
            message: "This question type does not use options.",
        });
    }
});

export const formPayloadSchema = z.object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(1000).default(""),
    fields: z.array(fieldSchema).min(1, "Add at least one question to your form.").max(50, "A form can contain at most 50 questions."),
    status: z.enum(["draft", "published"]).default("draft"),
})
.superRefine((form, context) => {
    const fieldIds = form.fields.map((field) => field.fieldId);

    if (new Set(fieldIds).size !== fieldIds.length) {
        context.addIssue({
            code: "custom",
            path: ["fields"],
            message: "Every question must have a unique field ID.",
        });
    }
});