import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    FileText,
    ClipboardCheck,
    AlertTriangle,
    ArrowRight,
    RefreshCw,
} from "lucide-react";

import { apiRequest } from "../services/api.js";

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalForms: 0,
        totalSubmissions: 0,
        totalIssues: 0,
        needsReview: 0,
        noIssues: 0,
        notChecked: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            setLoading(true);
            setError("");

            try {
                const [forms, submissionStats] = await Promise.all([
                    apiRequest("/forms"),
                    apiRequest("/submissions/stats"),
                ]);

                if (!active) return;

                setStats({
                    totalForms: forms.length,
                    totalSubmissions: submissionStats.totalSubmissions,
                    totalIssues: submissionStats.totalIssues,
                    needsReview: submissionStats.needsReview,
                    noIssues: submissionStats.noIssues,
                    notChecked: submissionStats.notChecked,
                });
            } catch (err) {
                if (active) {
                    setError(
                        err.message || "Unable to load dashboard statistics."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        loadDashboard();

        return () => {
            active = false;
        };
    }, [refreshKey]);

    const statistics = [
        {
            title: "Total Forms",
            value: stats.totalForms,
            description: "Forms created in the database",
            icon: FileText,
        },
        {
            title: "Submissions",
            value: stats.totalSubmissions,
            description: "Responses received",
            icon: ClipboardCheck,
        },
        {
            title: "Potential Issues",
            value: stats.totalIssues,
            description: `${stats.needsReview} submission(s) need review`,
            icon: AlertTriangle,
        },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
                        Overview
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight">
                        Welcome to FormGuard AI
                    </h1>

                    <p className="mt-2 max-w-2xl text-slate-500">
                        Build intelligent forms, review responses, and
                        identify potentially inconsistent answers.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setRefreshKey((value) => value + 1)}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </section>

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {statistics.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            key={stat.title}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-slate-500">
                                    {stat.title}
                                </p>

                                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                                    <Icon size={21} />
                                </div>
                            </div>

                            <p className="mt-5 text-3xl font-bold">
                                {loading ? "—" : stat.value}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                {loading ? "Loading statistics..." : stat.description}
                            </p>
                        </div>
                    );
                })}
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h2 className="text-lg font-semibold">
                        Submission overview
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        A summary of submissions based on their stored
                        validation status.
                    </p>

                    <div className="mt-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">
                                Needs review
                            </span>

                            <span className="font-semibold">
                                {loading ? "—" : stats.needsReview}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">
                                No issues recorded
                            </span>

                            <span className="font-semibold">
                                {loading ? "—" : stats.noIssues}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">
                                Not checked
                            </span>

                            <span className="font-semibold">
                                {loading ? "—" : stats.notChecked}
                            </span>
                        </div>
                    </div>

                    <Link
                        to="/submissions"
                        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                        View submissions
                        <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h2 className="text-lg font-semibold">
                        Create your next form
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Add questions, configure field types, and define
                        conditional rules that help respondents provide
                        consistent information.
                    </p>

                    <Link
                        to="/forms"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        Explore Forms
                        <ArrowRight size={17} />
                    </Link>
                </div>
            </section>
        </div>
    );
}