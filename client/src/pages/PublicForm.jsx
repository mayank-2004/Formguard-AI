// This is the page a respondent sees after opening a published form. It fetches the form's questions, renders the correct input for each field type, collects the answers, and submits them to Express.

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShieldCheck, Send } from "lucide-react";
import { apiRequest } from "../services/api";

export default function PublicForm() {
    const { id } = useParams();

    const [form, setForm] = useState(null);
    const [answers, setAnswers] = useState({})
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [pendingIssues, setPendingIssues] = useState([]);

    useEffect(() => {
        let active = true;

        async function loadForm() {
            try {
                const data = await apiRequest(`/public/forms/${id}`);

                if (active) {
                    setForm(data);
                }
            } catch (error) {
                if (active) {
                    setError(error.message || "Unable to load this form.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadForm();

        return () => {
            active = false;
        };
    }, [id]);

    function updateAnswer(fieldId, value) {
        setAnswers((current) => ({
            ...current,
            [fieldId]: value,
        }));

        // The respondent has changed an answer, so check again on submit.
        setPendingIssues([]);
    }

    async function submitAnswers(confirmed = false) {
        setError("");
        setSubmitting(true)

        try {
            const result = await apiRequest(
                `/public/forms/${id}/submissions`,
                {
                    method: "POST",
                    body: {
                        answers,
                        confirmed,
                    },
                }
            );

            if (result?.requiresConfirmation) {
                setPendingIssues(result.issues || []);
                return;
            }

            setPendingIssues([])
            setSubmitted(true)
        } catch (error) {
            setError(error.message || "Unable to submit your answers.")
        } finally {
            setSubmitting(false);
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        submitAnswers(false);
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">
                Loading form...
            </div>
        );
    }

    if (error && !form) {
        return (
            <div className="min-h-screen bg-slate-50 p-8">
                <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <h1 className="text-xl font-semibold">
                        Unable to open form
                    </h1>

                    <p className="mt-3 text-sm text-slate-500">{error}</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 px-5 py-16">
                <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
                        <ShieldCheck size={30} />
                    </div>

                    <h1 className="mt-5 text-2xl font-bold">
                        Submission received!
                    </h1>

                    <p className="mt-3 text-slate-500">
                        Thank you. Your answers have been saved successfully.
                    </p>
                </div>
            </div>
        )
    }

    function renderField(field) {
        const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
        const value = answers[field.fieldId] ?? "";

        if (field.type === "checkbox") {
            return (
                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={Boolean(value)}
                        required={field.required}
                        onChange={(event) => updateAnswer(field.fieldId, event.target.checked)}
                        className="mt-1 h-4 w-4 accent-indigo-600"
                    />
                    <span className="text-sm font-medium">
                        {field.label}
                        {field.required && (
                            <span className="text-red-500"> *</span>
                        )}
                    </span>
                </label>
            );
        }

        if (field.type === "radio") {
            return (
                <div className="space-y-3">
                    {field.options.map((option) => (
                        <label
                            key={option}
                            className="flex items-center gap-3 text-sm"
                        >
                            <input
                                type="radio"
                                name={field.fieldId}
                                value={option}
                                required={field.required}
                                checked={value === option}
                                onChange={() => updateAnswer(field.fieldId, option)}
                                className="h-4 w-4 accent-indigo-600"
                            />

                            {option}
                        </label>
                    ))}
                </div>
            );
        }

        if (field.type === "select") {
            return (
                <select
                    id={field.fieldId}
                    value={value}
                    required={field.required}
                    onChange={(event) =>
                        updateAnswer(field.fieldId, event.target.value)
                    }
                    className={inputClass}
                >
                    <option value="">Select an option</option>

                    {field.options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            );
        }

        if (field.type === "textarea") {
            return (
                <textarea
                    id={field.fieldId}
                    value={value}
                    required={field.required}
                    maxLength={5000}
                    rows={4}
                    onChange={(event) =>
                        updateAnswer(field.fieldId, event.target.value)
                    }
                    className={inputClass}
                />
            );
        }

        return (
            <input
                id={field.fieldId}
                type={field.type}
                value={value}
                required={field.required}
                maxLength={
                    ["text", "email"].includes(field.type) ? 5000 : undefined
                }
                onChange={(event) =>
                    updateAnswer(field.fieldId, event.target.value)
                }
                className={inputClass}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 px-5 py-12">
            <div className="mx-auto max-w-2xl">
                <div className="mb-8 flex items-center justify-center gap-2 text-indigo-700">
                    <ShieldCheck size={25} />
                    <span className="text-lg font-bold">FormGuard AI</span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-8 sm:px-8">
                        <h1 className="text-2xl font-bold">{form.title}</h1>

                        {form.description && (
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                                {form.description}
                            </p>
                        )}

                        <p className="mt-5 text-xs text-slate-500">
                            Questions marked with * are required.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
                        {form.fields.map((field, index) => (
                            <div key={field.fieldId} className="space-y-3">
                                {field.type !== "checkbox" && (
                                    <label
                                        htmlFor={field.fieldId}
                                        className="block text-sm font-semibold"
                                    >
                                        {index + 1}. {field.label}

                                        {field.required && (
                                            <span className="text-red-500"> *</span>
                                        )}
                                    </label>
                                )}

                                {renderField(field)}
                            </div>
                        ))}

                        {pendingIssues.length > 0 && (
                            <section
                                role="alert"
                                className="space-y-4 rounded-xl border border-amber-300 bg-amber-50 p-5"
                            >
                                <div>
                                    <h2 className="font-semibold text-amber-900">
                                        Please review your answers
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-amber-800">
                                        We found possible inconsistencies. Your submission
                                        has not been saved yet.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {pendingIssues.map((issue) => {
                                        const relatedQuestions = issue.fieldIds
                                            .map((fieldId) =>
                                                form.fields.find(
                                                    (field) => field.fieldId === fieldId
                                                )?.label
                                            )
                                            .filter(Boolean);

                                        return (
                                            <div
                                                key={issue.ruleId}
                                                className="rounded-lg border border-amber-200 bg-white p-3"
                                            >
                                                <p className="text-sm font-medium text-slate-800">
                                                    {issue.message}
                                                </p>

                                                {relatedQuestions.length > 0 && (
                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Related questions: {relatedQuestions.join(", ")}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <p className="text-sm text-amber-800">
                                    You can go back to your answers and correct the issue,
                                    or confirm that your answers are intentional.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => submitAnswers(true)}
                                    disabled={submitting}
                                    className="w-full rounded-xl bg-amber-700 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
                                >
                                    {submitting ? "Submitting..." : "Submit anyway"}
                                </button>
                            </section>
                        )}

                        {error && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            <Send size={17} />
                            {submitting ? "Checking answers..." : "Check answers and submit"}
                        </button>
                    </form>
                </div>

                <p className="mt-5 text-center text-xs text-slate-400">
                    Powered by FormGuard AI
                </p>
            </div>
        </div>
    );
}