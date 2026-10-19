// It lets users create or edit a form definition. Each question is represented by a JavaScript object in React state. When the user saves, the entire form definition is sent to the backend.

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { apiRequest } from "../services/api";

const fieldTypes = [
    { value: "text", label: "Short text" },
    { value: "textarea", label: "long text" },
    { value: "number", label: "Number" },
    { value: "email", label: "Email" },
    { value: "date", label: "Date" },
    { value: "select", label: "Dropdown" },
    { value: "radio", label: "Radio buttons" },
    { value: "checkbox", label: "Checkbox" },
];

function createField() {
    return {
        fieldId: crypto.randomUUID(),
        lable: "",
        type: "text",
        required: false,
        options: [],
    };
}

export default function FormBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("")
    const [fields, setFields] = useState([]);

    const [loading, setLoading] = useState(Boolean(id));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // If an id exists, load the existing form for editing.
    useEffect(() => {
        let active = true;

        async function loadForm() {
            if (!id) {
                setLoading(false);
                return;
            }

            try {
                const form = await apiRequest(`/forms/${id}`);

                if (!active) return;

                setTitle(form.title)
                setDescription(form.description || "")
                setFields(form.fields || [])
            } catch (err) {
                if (active) {
                    setError(err.message || "Unable to load this form.");
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        loadForm();

        return () => {
            active = false;
        };
    }, [id]);

    function addField() {
        setFields((current) => [...current, createField()]);
    }

    function updateField(fieldId, key, value) {
        setFields((current) =>
            current.map((field) => {
                if (field.fieldId !== fieldId) return field;

                if (key === "type") {
                    const isChoice = ["select", "radio"].includes(value);
                    const alreadyHasOptions = field.options.length >= 2;

                    return {
                        ...field,
                        type: value,
                        options: isChoice ? alreadyHasOptions ? field.options : ["Option1", "Option2"] : [],
                    };
                }

                return {
                    ...field,
                    [key]: value,
                };
            })
        );
    }

    function removeField(fieldId) {
        setFields((current) =>
            current.filter((field) => field.fieldId !== fieldId)
        );
    }

    async function handleSave(event) {
        event.preventDefault();
        setError("");

        if (!title.trim()) {
            setError("Please enter a form title.");
            return;
        }

        const normalizedFields = fields.map((field) => ({
            ...field,
            label: field.label.trim(),
            options: field.options
                .map((option) => option.trim())
                .filter(Boolean),
        }));

        if (normalizedFields.length === 0) {
            setError("Please add at least one question.");
            return;
        }

        if (normalizedFields.some((field) => !field.label)) {
            setError("Every question must have a label.");
            return;
        }

        if (
            normalizedFields.some(
                (field) =>
                    ["select", "radio"].includes(field.type) &&
                    field.options.length < 2
            )
        ) {
            setError(
                "Dropdowns and radio questions need at least two options."
            );
            return;
        }

        setSaving(true);

        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                fields: normalizedFields,
                status: "draft",
            };

            if (id) {
                await apiRequest(`/forms/${id}`, {
                    method: "PUT",
                    body: payload,
                });
            } else {
                await apiRequest("/forms", {
                    method: "POST",
                    body: payload,
                });
            }

            navigate("/forms");
        } catch (err) {
            setError(err.message || "Unable to save the form.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="py-16 text-center text-slate-500">
                Loading form...
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Link
                to="/forms"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
            >
                <ArrowLeft size={17} />
                Back to forms
            </Link>

            <div>
                <h1 className="text-2xl font-bold">
                    {id ? "Edit Form" : "Create Form"}
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Define your questions and configure their input types.
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
                    <div>
                        <label
                            htmlFor="form-title"
                            className="mb-2 block text-sm font-medium"
                        >
                            Form title *
                        </label>

                        <input
                            id="form-title"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="e.g. Employee Application"
                            maxLength={120}
                            required
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="form-description"
                            className="mb-2 block text-sm font-medium"
                        >
                            Description
                        </label>

                        <textarea
                            id="form-description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Explain the purpose of this form..."
                            maxLength={1000}
                            rows={3}
                            className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">Questions</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Add at least one question to save this form.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={addField}
                            disabled={fields.length >= 50}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                        >
                            <Plus size={17} />
                            Add question
                        </button>
                    </div>

                    {fields.map((field, index) => (
                        <div
                            key={field.fieldId}
                            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="font-semibold">
                                    Question {index + 1}
                                </h3>

                                <button
                                    type="button"
                                    onClick={() => removeField(field.fieldId)}
                                    aria-label={`Remove question ${index + 1}`}
                                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Question label *
                                </label>

                                <input
                                    value={field.label}
                                    onChange={(event) =>
                                        updateField(field.fieldId, "label", event.target.value)
                                    }
                                    placeholder="Enter your question"
                                    maxLength={200}
                                    required
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Input type
                                    </label>

                                    <select
                                        value={field.type}
                                        onChange={(event) =>
                                            updateField(field.fieldId, "type", event.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-indigo-500"
                                    >
                                        {fieldTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <label className="flex items-center gap-3 self-end rounded-xl bg-slate-50 p-3 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(event) =>
                                            updateField(
                                                field.fieldId,
                                                "required",
                                                event.target.checked
                                            )
                                        }
                                        className="h-4 w-4 accent-indigo-600"
                                    />
                                    Required question
                                </label>
                            </div>

                            {["select", "radio"].includes(field.type) && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        Options (one per line)
                                    </label>

                                    <textarea
                                        value={field.options.join("\n")}
                                        onChange={(event) =>
                                            updateField(
                                                field.fieldId,
                                                "options",
                                                event.target.value
                                                    .split(/\r?\n/)
                                                    .map((option) => option.trim())
                                            )
                                        }
                                        rows={4}
                                        placeholder={"Option 1\nOption 2\nOption 3"}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                                    />

                                    <p className="mt-1 text-xs text-slate-500">
                                        Enter each option on a separate line.
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}

                    {fields.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                            <p className="font-medium">No questions added</p>
                            <p className="mt-2 text-sm text-slate-500">
                                Click “Add question” to begin creating your form.
                            </p>
                        </div>
                    )}
                </section>

                {error && (
                    <div
                        role="alert"
                        className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                <div className="flex flex-wrap justify-end gap-3">
                    <Link
                        to="/forms"
                        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium hover:bg-slate-50"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Save size={17} />
                        {saving ? "Saving..." : "Save form"}
                    </button>
                </div>
            </form>
        </div>
    )

}