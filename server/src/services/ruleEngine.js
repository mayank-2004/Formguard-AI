// This file contains the actual logic for detecting consistency problems. It receives a saved form and a set of answers, evaluates the configured rules, and returns the issues it finds.

function isEmpty(value) {
    return (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0)
    );
}

function matches(actual, expected) {
    return (
        String(actual ?? "").trim().toLowerCase() === String(expected ?? "").trim().toLowerCase()
    );
}

export function evaluateConsistencyRules(form, answerValues) {
    const issues = [];
    const fields = new Map(
        form.fields.map((field) => [field.fieldId, field])
    );

    for (const rule of form.consistencyRules || []) {
        const sourceField = fields.get(rule.sourceFieldId);
        const targetField = fields.get(rule.targetFieldId);

        // Skip invalid references defensively.
        // Valid form rules are checked when the form is saved.
        if (!sourceField || !targetField) {
            continue;
        }

        const sourceValue = answerValues[rule.sourceFieldId];
        const targetValue = answerValues[rule.targetFieldId];

        let message = "";
        let severity = "medium";
        let blocking = false;

        if (rule.type === "required_if") {
            if (matches(sourceValue, rule.sourceValue) && isEmpty(targetValue)) {
                message = rule.message || `"${targetField.label}" is required when "${sourceField.label}" is "${rule.sourceValue}".`;

                severity = "high";
                blocking = true;
            }
        }

        if (rule.type === "conflicts_with") {
            if (matches(sourceValue, rule.sourceValue) &&
                matches(targetValue, rule.targetValue)
            ) {
                message = `"${sourceField.label}" and "${targetField.label}" may contradict each other. Please review your answers.`;

                severity = "high";
                blocking = false;
            }
        }

        if (rule.type === "date_order") {
            if (!isEmpty(sourceValue) && !isEmpty(targetValue)) {
                if (targetValue < sourceValue) {
                    message = rule.message ||
                        `"${targetField.label}" cannot be earlier than "${sourceField.label}".`;

                    severity = "high";
                    blocking = true;
                }
            }
        }
        if (message) {
            issues.push({
                ruleId: rule.ruleId,
                type: rule.type,
                fieldIds: [rule.sourceField, rule.targetFieldId],
                severity,
                blocking,
                message,
            });
        }
    }
    return issues;
}