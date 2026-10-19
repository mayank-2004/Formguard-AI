import { FileText, ClipboardCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const statistics = [
    {
        title: "Total Forms",
        value: "0",
        description: "Forms created so far",
        icon: FileText,
    },
    {
        title: "Submissions",
        value: "0",
        description: "Total submissions received",
        icon: ClipboardCheck,
    },
    {
        title: "Potential Issues",
        value: "0",
        description: "Items requiring attention",
        icon: AlertTriangle,
    }
];

export default function Dashboard() {
    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <section>
                <p className="text-sm font-medium text-indigo-600">
                    OVERVIEW
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                    Welcome to FormGuard AI
                </h1>

                <p className="mt-2 max-w-2xl text-slate-500">
                    Build intelligent forms, check answers for inconsistencies,
                    and help users submit more accurate information.
                </p>
            </section>

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
                                {stat.value}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                {stat.description}
                            </p>
                        </div>
                    );
                })}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-xl">
                        <div className="mb-3 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                            GET STARTED
                        </div>

                        <h2 className="text-xl font-semibold">
                            Create your first form
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Start with a few questions. Next, we'll add rules that
                            detect missing information and conflicting answers.
                        </p>
                    </div>

                    <Link
                        to="/forms"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        Explore Forms
                        <ArrowRight size={17} />
                    </Link>
                </div>
            </section>
        </div>
    )
}