import { FileText, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function Forms() {

    const [forms, setForms] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [deletingId, setDeletingId] = useState(null)

    async function loadForms() {
        setLoading(true);
        setError("");

        try {
            const data = await apiRequest("/forms");
            setForms(data || []);
        } catch (error) {
            setError(error.message || "Unable to load forms.")
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadForms();
    }, []);

    async function handleDelete(form) {
        const confirmed = window.confirm(
            `Delete "${form.title}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        setDeletingId(form._id);
        setError("");

        try {
            await apiRequest(`/forms/${form._id}`, {
                method: "DELETE",
            });

            setForms((current) =>
                current.filter((item) => item._id !== form._id)
            );
        } catch (error) {
            setError(error.message || "Unable to delete this form.");
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Forms</h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Create and manage your form definitions.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={loadForms}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <Link
                        to="/forms/new"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        Create Form
                    </Link>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                    Loading forms...
                </div>
            ) : forms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <FileText size={27} />
                    </div>

                    <h2 className="mt-5 text-lg font-semibold">
                        No forms created yet
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                        Create your first form, add questions, and save it to your database.
                    </p>

                    <Link
                        to="/forms/new"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        <Plus size={17} />
                        Create your first form
                    </Link>
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {forms.map((form) => (
                        <article
                            key={form._id}
                            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <FileText size={22} />
                                </div>

                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                                    {form.status}
                                </span>
                            </div>

                            <h2 className="mt-4 text-lg font-semibold break-words">
                                {form.title}
                            </h2>

                            <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
                                {form.description || "No description provided."}
                            </p>

                            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                <span>
                                    {form.fields.length}{" "}
                                    {form.fields.length === 1 ? "question" : "questions"}
                                </span>

                                <span>
                                    Updated{" "}
                                    {new Date(form.updatedAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                                <Link
                                    to={`/forms/${form._id}/edit`}
                                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium hover:bg-slate-50"
                                >
                                    <Pencil size={16} />
                                    Edit
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => handleDelete(form)}
                                    disabled={deletingId === form._id}
                                    aria-label={`Delete ${form.title}`}
                                    className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                    <Trash2 size={17} />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    )
}
