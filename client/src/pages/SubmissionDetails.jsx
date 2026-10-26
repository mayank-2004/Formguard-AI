import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    Clock,
    FileText,
} from "lucide-react";

import { apiRequest } from "../services/api.js";

function formatValue(value) {
    if (value === undefined || value === null || value === "") {
        return "—";
    }

    if (typeof value === "boolean") {
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

function formatStatus(status) {
    switch (status) {
        case "needs_review":
            return "Needs review";
        case "no_issues":
            return "No issues";
        case "not_checked":
            return "Not checked";
        default:
            return status || "Unknown";
    }
}

export default function SubmissionDetails() {
    const { id } = useParams();

    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadSubmission() {
            setLoading(true);
            setError("");

            try {
                const data = await apiRequest(`/submissions/${id}`);

                if (active) {
                    setSubmission(data);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.message || "Unable to load submission details."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadSubmission();

        return () => {
            active = false;
        };
    }, [id]);

    if (loading) {
        return (
            <div className="py-16 text-center text-slate-500">
                Loading submission details...
            </div>
        );
    }

    if (error || !submission) {
        return (
            <div className="mx-auto max-w-3xl space-y-4">
                <Link
                    to="/submissions"
                    className="inline-flex items-center gap-2 text-sm text-indigo-600"
                >
                    <ArrowLeft size={17} />
                    Back to submissions
                </Link>

                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
                >
                    {error || "Submission not found."}
                </div>
            </div>
        );
    }

    const issues = submission.issues || [];
    const answers = submission.answers || [];

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Link
                to="/submissions"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600"
            >
                <ArrowLeft size={17} />
                Back to submissions
            </Link>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                            <FileText size={24} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold">
                                {submission.formTitle || "Untitled form"}
                            </h1>

                            <p className="mt-2 break-all text-xs text-slate-400">
                                Submission ID: {submission._id}
                            </p>
                        </div>
                    </div>

                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                        <Clock size={14} />
                        {formatStatus(submission.validationStatus)}
                    </span>
                </div>

                <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                    <div>
                        <p className="text-sm text-slate-500">
                            Submitted at
                        </p>

                        <p className="mt-1 font-medium">
                            {submission.createdAt
                                ? new Date(submission.createdAt).toLocaleString()
                                : "—"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500">
                            Questions answered
                        </p>

                        <p className="mt-1 font-medium">
                            {answers.length}
                        </p>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div>
                    <h2 className="text-xl font-bold">Submitted answers</h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Review the answers saved with this submission.
                    </p>
                </div>

                {answers.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                        No answer records were found.
                    </div>
                ) : (
                    answers.map((answer, index) => (
                        <article
                            key={answer.fieldId || index}
                            className="rounded-2xl border border-slate-200 bg-white p-5"
                        >
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Question {index + 1}
                            </p>

                            <h3 className="mt-2 font-semibold">
                                {answer.label || "Untitled question"}
                            </h3>

                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                                {formatValue(answer.value)}
                            </p>
                        </article>
                    ))
                )}
            </section>

            <section className="space-y-4">
                <div>
                    <h2 className="text-xl font-bold">
                        Consistency review
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Rules that produced warnings for this submission.
                    </p>
                </div>

                {issues.length === 0 ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5">
                        <CheckCircle2
                            size={22}
                            className="mt-0.5 text-green-700"
                        />

                        <div>
                            <h3 className="font-semibold text-green-900">
                                No recorded issues
                            </h3>

                            <p className="mt-1 text-sm text-green-800">
                                No consistency warnings were saved with this submission.
                                This does not mean that every answer is necessarily correct.
                            </p>
                        </div>
                    </div>
                ) : (
                    issues.map((issue, index) => {
                        const relatedAnswers = answers.filter((answer) =>
                            (issue.fieldIds || []).includes(answer.fieldId)
                        );

                        return (
                            <article
                                key={issue.ruleId || index}
                                className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
                            >
                                <div className="flex items-start gap-3">
                                    <AlertTriangle
                                        size={22}
                                        className="mt-0.5 text-amber-700"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold text-amber-950">
                                                {issue.type === "conflicts_with"
                                                    ? "Potential contradiction"
                                                    : issue.type === "required_if"
                                                        ? "Conditional requirement"
                                                        : issue.type === "date_order"
                                                            ? "Date order issue"
                                                            : "Consistency issue"}
                                            </h3>

                                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium capitalize text-amber-900">
                                                {issue.severity || "medium"}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-sm leading-6 text-amber-950">
                                            {issue.message}
                                        </p>

                                        {relatedAnswers.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {relatedAnswers.map((answer) => (
                                                    <div
                                                        key={answer.fieldId}
                                                        className="rounded-lg border border-amber-200 bg-white p-3"
                                                    >
                                                        <p className="text-xs font-medium text-slate-500">
                                                            {answer.label}
                                                        </p>

                                                        <p className="mt-1 break-words text-sm text-slate-800">
                                                            {formatValue(answer.value)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })
                )}
            </section>
        </div>
    );
}