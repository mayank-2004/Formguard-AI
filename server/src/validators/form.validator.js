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
        if (isChoiceField && field.options.length < 2) {
            context.addIssue({
                code: "custom",
                path: ["options"],
                message: "Add at least two options to this question.",
            });
        }

        if (isChoiceField) {
            const normalizedOptions = field.options.map((option) => option.toLocaleLowerCase());

            if (new Set(normalizedOptions).size !== normalizedOptions.length) {
                context.addIssue({
                    code: "custom",
                    path: ["options"],
                    message: "Question options must be unique.",
                });
            }
        }

        if (!isChoiceField && field.options.length > 0) {
            context.addIssue({
                code: "custom",
                path: ["options"],
                message: "This question type does not use options.",
            });
        }
    });

const consistencyRuleSchema = z.object({
    ruleId: z.string().trim().min(1).max(100),

    type: z.enum([
        "required_if",
        "conflicts_with",
        "date_order",
    ]),

    sourceFieldId: z.string().trim().min(1).max(100),
    sourceValue: z.string().trim().max(200).default(""),
    targetFieldId: z.string().trim().min(1).max(100),
    targetValue: z.string().trim().max(200).default(""),
    message: z.string().trim().max(300).default(""),
});

export const formPayloadSchema = z.object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(1000).default(""),
    fields: z.array(fieldSchema).min(1, "Add at least one question to your form.").max(50, "A form can contain at most 50 questions."),
    status: z.enum(["draft", "published"]).default("draft"),
    consistencyRules: z.array(consistencyRuleSchema).max(50).default([]),
})
    .superRefine((form, context) => {
        const fieldIds = form.fields.map((field) => field.fieldId);
        const fieldMap = new Map(
            form.fields.map((field) => [field.fieldId, field])
        );

        if (new Set(fieldIds).size !== fieldIds.length) {
            context.addIssue({
                code: "custom",
                path: ["fields"],
                message: "Every question must have a unique field ID.",
            });
        }

        form.consistencyRules.forEach((rule, index) => {
            const sourceField = fieldMap.get(rule.sourceFieldId);
            const targetField = fieldMap.get(rule.targetFieldId);

            if (!sourceField) {
                context.addIssue({
                    code: "custom",
                    path: ["consistencyRules", index, "sourceFieldId"],
                    message: "Choose a valid source question.",
                });
            }

            if (!targetField) {
                context.addIssue({
                    code: "custom",
                    path: ["consistencyRules", index, "targetFieldId"],
                    message: "Choose a valid target question.",
                });
            }

            if (rule.sourceFieldId && rule.sourceFieldId === rule.targetFieldId) {
                context.addIssue({
                    code: "custom",
                    path: ["consistencyRules", index, "targetFieldId"],
                    message: "A rule must refer to two different questions.",
                });
            }

            if (rule.type === "required_if" && !rule.sourceValue.trim()) {
                context.addIssue({
                    code: "custom",
                    path: ["consistencyRules", index, "sourceValue"],
                    message: "Enter the answer that activates this rule.",
                });
            }

            if (rule.type === "conflicts_with" && (!rule.sourceValue.trim() || !rule.targetValue.trim())) {
                context.addIssue({
                    code: "custom",
                    path: ["consistencyRules", index],
                    message: "Enter both answers that form the conflict.",
                });
            }

            if (rule.type === "date_order" && sourceField && targetField && (sourceField.type !== "date" || targetField.type !== "date")) {
                context.addIssue({
                    code: "custom",
                    path: ["consistencyRules", index],
                    message: "Date-order rules require two date questions.",
                });
            }
        });
    });