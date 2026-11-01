
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
    ShieldCheck,
    Send,
    AlertTriangle,
    Eye,
    Info,
} from "lucide-react";
import { apiRequest } from "../services/api";

// Format respondent answers for displaying inside warning cards.
function formatDisplayAnswer(value, field) {
    if (value === undefined || value === null || value === "") {
        return "Not answered";
    }

    if (field?.type === "checkbox") {
        return value ? "Yes" : "No";
    }

    if (Array.isArray(value)) {
        return value.join(", ");
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return String(value);
}

export default function PublicForm() {
    const { id } = useParams();

    const answersStartRef = useRef(null);

    const [form, setForm] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const [pendingIssues, setPendingIssues] = useState([]);
    const [aiConsent, setAiConsent] = useState(false);
    const [confirmationToken, setConfirmationToken] = useState("");
    const [aiCheckStatus, setAiCheckStatus] = useState("not_consented");

    // Fetch published form from backend.
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

    // Update respondent answer.
    function updateAnswer(fieldId, value) {
        setAnswers((current) => ({
            ...current,
            [fieldId]: value,
        }));

        // Any answer change invalidates the previous AI result
        // and confirmation token.
        setPendingIssues([]);
        setConfirmationToken("");
        setError("");
    }

    // Submit answers to backend.
    async function submitAnswers(confirmed = false) {
        setError("");
        setSubmitting(true);

        try {
            const result = await apiRequest(
                `/public/forms/${id}/submissions`,
                {
                    method: "POST",
                    body: {
                        answers,
                        aiConsent,
                        confirmed,
                        ...(confirmed
                            ? { confirmationToken }
                            : {}),
                    },
                }
            );

            // Backend detected warnings and requires confirmation.
            if (result?.requiresConfirmation) {
                setPendingIssues(result.issues || []);

                setConfirmationToken(
                    result.confirmationToken || ""
                );

                setAiCheckStatus(
                    result.aiCheckStatus || "not_consented"
                );

                return;
            }

            // Submission completed successfully.
            setPendingIssues([]);
            setConfirmationToken("");

            setAiCheckStatus(
                result?.aiCheckStatus || "not_consented"
            );

            setSubmitted(true);

        } catch (err) {
            setError(err.message || "Unable to submit your answers.");
        } finally {
            setSubmitting(false);
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        submitAnswers(false);
    }

    // Scroll respondent back to the questions.
    function reviewAnswers() {
        answersStartRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }

    // Loading state.
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">
                Loading form...
            </div>
        );
    }

    // Form loading error.
    if (error && !form) {
        return (
            <div className="min-h-screen bg-slate-50 p-8">
                <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <h1 className="text-xl font-semibold">
                        Unable to open form
                    </h1>

                    <p className="mt-3 text-sm text-slate-500">
                        {error}
                    </p>
                </div>
            </div>
        );
    }

    // Submission success page.
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

                    <p className="mt-3 text-sm text-slate-500">
                        {aiCheckStatus === "completed"
                            ? "AI consistency checking completed."
                            : aiCheckStatus === "failed"
                                ? "Your submission was received, but the AI check was unavailable."
                                : aiCheckStatus === "not_configured"
                                    ? "Your submission was received, but AI checking is not configured."
                                    : "Your submission was received. AI checking was not enabled."}
                    </p>
                </div>
            </div>
        );
    }

    // Render appropriate input based on field type.
    function renderField(field) {
        const inputClass =
            "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

        const value = answers[field.fieldId] ?? "";

        if (field.type === "checkbox") {
            return (
                <label className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={Boolean(value)}
                        required={field.required}
                        onChange={(event) =>
                            updateAnswer(field.fieldId, event.target.checked)
                        }
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
                                onChange={() =>
                                    updateAnswer(field.fieldId, option)
                                }
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
                    ["text", "email"].includes(field.type)
                        ? 5000
                        : undefined
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

                {/* Application branding */}
                <div className="mb-8 flex items-center justify-center gap-2 text-indigo-700">
                    <ShieldCheck size={25} />

                    <span className="text-lg font-bold">
                        FormGuard AI
                    </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    {/* Form header */}
                    <div className="border-b border-slate-200 px-6 py-8 sm:px-8">
                        <h1 className="text-2xl font-bold">
                            {form.title}
                        </h1>

                        {form.description && (
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                                {form.description}
                            </p>
                        )}

                        <p className="mt-5 text-xs text-slate-500">
                            Questions marked with * are required.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6 p-6 sm:p-8"
                    >

                        {/* Form questions */}
                        <div
                            ref={answersStartRef}
                            className="space-y-6 scroll-mt-6"
                        >
                            {form.fields.map((field, index) => (
                                <div
                                    key={field.fieldId}
                                    className="space-y-3"
                                >
                                    {field.type !== "checkbox" && (
                                        <label
                                            htmlFor={field.fieldId}
                                            className="block text-sm font-semibold"
                                        >
                                            {index + 1}. {field.label}

                                            {field.required && (
                                                <span className="text-red-500">
                                                    {" "}*
                                                </span>
                                            )}
                                        </label>
                                    )}

                                    {renderField(field)}
                                </div>
                            ))}
                        </div>

                        {/* ================================= */}
                        {/* AI CONSISTENCY WARNING PANEL */}
                        {/* ================================= */}

                        {pendingIssues.length > 0 && (
                            <section
                                role="alert"
                                aria-live="assertive"
                                className="space-y-5 rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6"
                            >

                                {/* Warning heading */}
                                <div className="flex items-start gap-3">

                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                        <AlertTriangle size={22} />
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-bold text-amber-950">
                                            Possible inconsistency detected
                                        </h2>

                                        <p className="mt-1 text-sm leading-6 text-amber-800">
                                            FormGuard AI identified answers that may contradict
                                            each other. Please review the details below.
                                        </p>

                                        <p className="mt-2 text-xs font-medium text-amber-800">
                                            Your submission has not been saved yet.
                                        </p>
                                    </div>
                                </div>

                                {/* Individual detected issues */}
                                <div className="space-y-4">

                                    {pendingIssues.map((issue, issueIndex) => {

                                        const issueFieldIds = Array.isArray(issue.fieldIds)
                                            ? issue.fieldIds
                                            : [];

                                        const relatedFields = issueFieldIds
                                            .map((fieldId) =>
                                                form.fields.find(
                                                    (field) =>
                                                        field.fieldId === fieldId
                                                )
                                            )
                                            .filter(Boolean);

                                        const isAiIssue =
                                            issue.type === "ai_contradiction";

                                        return (
                                            <div
                                                key={
                                                    issue.ruleId ||
                                                    `${issue.type || "issue"}-${issueIndex}`
                                                }
                                                className="space-y-4 rounded-xl border border-amber-200 bg-white p-4 sm:p-5"
                                            >

                                                {/* Issue type and confidence */}
                                                <div className="flex flex-wrap items-center justify-between gap-2">

                                                    <span className="text-xs font-bold uppercase tracking-wide text-amber-800">
                                                        {isAiIssue
                                                            ? "AI-detected possible contradiction"
                                                            : "Form consistency warning"}
                                                    </span>

                                                    {isAiIssue && issue.severity && (
                                                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold capitalize text-amber-900">
                                                            AI confidence: {issue.severity}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Question and answer comparison */}
                                                {relatedFields.length > 0 && (
                                                    <div className="space-y-3">

                                                        {relatedFields.map((field) => {

                                                            const questionNumber =
                                                                form.fields.findIndex(
                                                                    (item) =>
                                                                        item.fieldId === field.fieldId
                                                                ) + 1;

                                                            return (
                                                                <div
                                                                    key={field.fieldId}
                                                                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                                                                >

                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                        Question {questionNumber}
                                                                    </p>

                                                                    <p className="mt-1 text-sm font-semibold text-slate-800">
                                                                        {field.label}
                                                                    </p>

                                                                    <div className="mt-3">
                                                                        <p className="text-xs font-medium text-slate-500">
                                                                            Respondent's answer
                                                                        </p>

                                                                        <p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-indigo-700">
                                                                            {formatDisplayAnswer(
                                                                                answers[field.fieldId],
                                                                                field
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                    </div>
                                                )}

                                                {/* AI explanation */}
                                                <div className="rounded-lg bg-amber-50 p-4">

                                                    <div className="flex items-center gap-2 text-amber-900">
                                                        <Info size={16} />

                                                        <p className="text-sm font-semibold">
                                                            Why was this flagged?
                                                        </p>
                                                    </div>

                                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900">
                                                        {issue.message}
                                                    </p>
                                                </div>

                                            </div>
                                        );
                                    })}

                                </div>

                                {/* Instructions */}
                                <div className="rounded-lg border border-amber-200 bg-white p-4">
                                    <p className="text-sm leading-6 text-slate-700">
                                        Review the questions and answers above.
                                        You can correct your answers and run the
                                        consistency check again, or confirm that
                                        your answers are intentional.
                                    </p>
                                </div>

                                {/* Warning actions */}
                                <div className="flex flex-col gap-3 sm:flex-row">

                                    <button
                                        type="button"
                                        onClick={reviewAnswers}
                                        disabled={submitting}
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                                    >
                                        <Eye size={17} />
                                        Review answers
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => submitAnswers(true)}
                                        disabled={
                                            submitting ||
                                            !confirmationToken
                                        }
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
                                    >
                                        <Send size={17} />

                                        {submitting
                                            ? "Submitting..."
                                            : "Submit anyway"}
                                    </button>

                                </div>

                                <p className="text-xs leading-5 text-amber-800">
                                    Editing an answer will clear this warning and
                                    invalidate the previous confirmation. Your
                                    answers will be checked again when you submit.
                                </p>

                            </section>
                        )}

                        {/* AI consent */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                            <label className="flex items-start gap-3">

                                <input
                                    type="checkbox"
                                    checked={aiConsent}
                                    onChange={(event) => {
                                        setAiConsent(event.target.checked);
                                        setPendingIssues([]);
                                        setConfirmationToken("");
                                        setError("");
                                    }}
                                    className="mt-1 h-4 w-4 accent-indigo-600"
                                />

                                <span className="text-sm font-medium text-slate-800">
                                    Allow AI consistency checking

                                    <span className="mt-1 block font-normal leading-5 text-slate-500">
                                        If enabled, the form's question labels,
                                        field types, options, and your answers
                                        are processed by the AI model configured
                                        for this application. With the current
                                        local Ollama setup, this processing takes
                                        place on the machine running the backend.
                                        If unchecked, the form's configured
                                        validation rules still apply, but AI
                                        analysis will not run.
                                    </span>
                                </span>

                            </label>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                            >
                                {error}
                            </div>
                        )}

                        {/* Main submit button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            <Send size={17} />

                            {submitting
                                ? "Checking answers..."
                                : "Check answers and submit"}
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
