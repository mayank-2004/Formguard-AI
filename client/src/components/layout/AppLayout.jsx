import { NavLink, Outlet } from "react-router-dom"
import { ShieldCheck, LayoutDashboard, FileText, ClipboardList, Settings } from "lucide-react"

const navigation = [
    {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard
    },
    {
        name: "Forms",
        path: "/forms",
        icon: FileText
    },
    {
        name: "Submissions",
        path: "/submissions",
        icon: ClipboardList
    },
]

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white md:flex md:flex-col">
                <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                        <ShieldCheck size={23} />
                    </div>

                    <div>
                        <h1 className="text-lg font-bold">FormGuard AI</h1>
                        <p className="text-xs text-slate-500">
                            Intelligent form validation
                        </p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2 px-4 py-6">
                    <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Workspace
                    </p>

                    {navigation.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive
                                        ? "bg-indigo-50 text-indigo-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`
                                }
                            >
                                <Icon size={19} />
                                {item.name}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="border-t border-slate-100 p-4">
                    <div className="flex items-center gap-3 rounded-xl p-3 text-slate-600">
                        <Settings size={19} />
                        <span className="text-sm">Settings (coming soon)</span>
                    </div>
                </div>
            </aside>

            <div className="min-h-screen md:pl-64">
                <header className="border-b border-slate-200 bg-white">
                    <div className="flex min-h-20 items-center justify-between gap-4 px-5 sm:px-8">
                        <div>
                            <p className="text-sm text-slate-500">Workspace</p>
                            <h2 className="text-lg font-semibold">
                                Form Management
                            </h2>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                            FG
                        </div>
                    </div>

                    <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-3 md:hidden">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "text-slate-600"
                                        }`
                                    }
                                >
                                    <Icon size={17} />
                                    {item.name}
                                </NavLink>
                            );
                        })}
                    </nav>
                </header>

                <main className="p-5 sm:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}