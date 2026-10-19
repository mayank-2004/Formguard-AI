import { ClipboardList } from "lucide-react";

export default function Submissions() {
    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Submissions</h1>

                <p className="mt-2 text-sm text-slate-500">
                    Review submitted answers and detected inconsistencies.
                </p>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <ClipboardList size={27} />
                </div>

                <h2 className="mt-5 text-lg font-semibold">
                    No submissions yet
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    When users submit published forms, their responses and
                    validation results will appear here.
                </p>
            </div>
        </div>
    )
}