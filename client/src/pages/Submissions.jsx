import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    ClipboardList,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
} from "lucide-react";

import { apiRequest } from "../services/api.js";

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

function statusClasses(status) {
    switch (status) {
        case "needs_review":
            return "bg-amber-50 text-amber-800";
        case "no_issues":
            return "bg-green-50 text-green-700";
        case "not_checked":
            return "bg-slate-100 text-slate-600";
        default:
            return "bg-slate-100 text-slate-600";
    }
}

function formatDate(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "—";
    }

    return parsedDate.toLocaleString();
}

export default function Submissions() {
    const [items, setItems] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let active = true;

        async function loadSubmissions() {
            setLoading(true);
            setError("");

            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: "10",
                });

                if (status !== "all") {
                    params.set("status", status);
                }

                if (query) {
                    params.set("q", query);
                }

                const result = await apiRequest(
                    `/submissions?${params.toString()}`
                );

                if (!active) return;

                setItems(result.items || []);
                setPagination(
                    result.pagination || {
                        page,
                        limit: 10,
                        total: 0,
                        totalPages: 0,
                    }
                );
            } catch (err) {
                if (active) {
                    setError(
                        err.message || "Unable to load submissions."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadSubmissions();

        return () => {
            active = false;
        };
    }, [page, status, query, refreshKey]);

    function handleSearch(event) {
        event.preventDefault();
        setPage(1);
        setQuery(searchInput.trim());
    }

    function handleStatusChange(event) {
        setPage(1);
        setStatus(event.target.value);
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <section>
                <p className="text-sm font-medium uppercase tracking-wide text-indigo-600">
                    FormGuard AI
                </p>

                <h1 className="mt-2 text-2xl font-bold">
                    Submission History
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Review submitted responses and investigate possible
                    inconsistencies.
                </p>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">
                        Total submissions
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                        {pagination.total}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm text-slate-500">
                        Results on this page
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                        {items.length}
                    </p>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <form
                    onSubmit={handleSearch}
                    className="flex flex-col gap-3 md:flex-row"
                >
                    <div className="relative flex-1">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            value={searchInput}
                            onChange={(event) =>
                                setSearchInput(event.target.value)
                            }
                            placeholder="Search by form title..."
                            maxLength={100}
                            className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={handleStatusChange}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500"
                    >
                        <option value="all">All statuses</option>
                        <option value="needs_review">Needs review</option>
                        <option value="no_issues">No issues</option>
                        <option value="not_checked">Not checked</option>
                    </select>

                    <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        <Search size={17} />
                        Search
                    </button>

                    <button
                        type="button"
                        onClick={() => setRefreshKey((value) => value + 1)}
                        disabled={loading}
                        title="Refresh submissions"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw size={17} />
                    </button>
                </form>
            </section>

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">
                        Loading submissions...
                    </div>
                ) : items.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <ClipboardList
                            size={32}
                            className="mx-auto text-slate-400"
                        />

                        <h2 className="mt-4 font-semibold">
                            No submissions found
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Submitted responses will appear here. Try changing
                            your search or status filter.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4 font-medium">
                                            Form
                                        </th>

                                        <th className="px-5 py-4 font-medium">
                                            Submitted at
                                        </th>

                                        <th className="px-5 py-4 font-medium">
                                            Status
                                        </th>

                                        <th className="px-5 py-4 font-medium">
                                            Issues
                                        </th>

                                        <th className="px-5 py-4 font-medium">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item) => (
                                        <tr
                                            key={item._id}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="px-5 py-4 font-medium">
                                                {item.formTitle}
                                            </td>

                                            <td className="px-5 py-4 text-slate-500">
                                                {formatDate(item.createdAt)}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClasses(item.validationStatus)}`}
                                                >
                                                    {formatStatus(item.validationStatus)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5">
                                                    {(item.issues || []).length > 0 && (
                                                        <AlertTriangle
                                                            size={15}
                                                            className="text-amber-600"
                                                        />
                                                    )}

                                                    {(item.issues || []).length}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <Link
                                                    to={`/submissions/${item._id}`}
                                                    className="font-medium text-indigo-600 hover:text-indigo-800"
                                                >
                                                    View details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500">
                                {pagination.total === 0
                                    ? "No results"
                                    : `Showing ${(page - 1) * pagination.limit + 1}–${Math.min(page * pagination.limit, pagination.total)} of ${pagination.total} submissions`}
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((current) => Math.max(1, current - 1))
                                    }
                                    disabled={page <= 1 || loading}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>

                                <span className="px-2 text-sm text-slate-500">
                                    Page {page} of {Math.max(1, pagination.totalPages)}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((current) => current + 1)
                                    }
                                    disabled={
                                        loading ||
                                        pagination.totalPages === 0 ||
                                        page >= pagination.totalPages
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}