import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    ShieldCheck,
    LayoutDashboard,
    FileText,
    ClipboardList,
    Settings,
    LogOut,
} from "lucide-react";

import { useAuth } from "../../features/auth/AuthContext.jsx";

const navigation = [
    {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        name: "Forms",
        path: "/forms",
        icon: FileText,
    },
    {
        name: "Submissions",
        path: "/submissions",
        icon: ClipboardList,
    },
];

export default function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [loggingOut, setLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState("");

    async function handleLogout() {
        if (loggingOut) return;

        setLoggingOut(true);
        setLogoutError("");

        try {
            await logout();

            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Logout request failed:", error);

            setLogoutError(
                "The logout request failed. Please check your connection and try again."
            );
        } finally {
            setLoggingOut(false);
        }
    }

    const initials = (user?.name || "FG")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white md:flex md:flex-col">
                <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                        <ShieldCheck size={23} />
                    </div>

                    <div className="min-w-0">
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

            {/* Main application */}
            <div className="min-h-screen md:pl-64">
                <header className="border-b border-slate-200 bg-white">
                    <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-8">
                        {/* Page title */}
                        <div className="min-w-0">
                            <p className="text-sm text-slate-500">
                                Workspace
                            </p>

                            <h2 className="truncate text-lg font-semibold">
                                Form Management
                            </h2>
                        </div>

                        {/* User profile and logout */}
                        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                            <div className="hidden min-w-0 text-right sm:block">
                                <p className="max-w-48 truncate text-sm font-semibold">
                                    {user?.name || "FormGuard User"}
                                </p>

                                <p className="max-w-48 truncate text-xs text-slate-500">
                                    {user?.email || ""}
                                </p>
                            </div>

                            <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700"
                                title={user?.name || "FormGuard User"}
                                aria-label="Current user"
                            >
                                {initials}
                            </div>

                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={loggingOut}
                                title="Sign out of FormGuard AI"
                                aria-label="Log out"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
                            >
                                <LogOut size={17} />

                                <span className="hidden sm:inline">
                                    {loggingOut ? "Signing out..." : "Logout"}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile navigation */}
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
                                            : "text-slate-600 hover:bg-slate-50"
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

                {/* Logout error */}
                {logoutError && (
                    <div className="px-5 pt-4 sm:px-8">
                        <div
                            role="alert"
                            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        >
                            {logoutError}
                        </div>
                    </div>
                )}

                {/* Current page */}
                <main className="p-5 sm:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}