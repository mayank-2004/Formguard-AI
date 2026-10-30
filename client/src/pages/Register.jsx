import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import { useAuth } from "../features/auth/AuthContext";

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (new TextEncoder().encode(password).length > 72) {
            setError("Password must not exceed 72 UTF-8 bytes.");
            return;
        }

        setLoading(true);

        try {
            await register({
                name: name.trim(),
                email: email.trim(),
                password,
            });

            navigate("/dashboard", { replace: true });
        } catch (error) {
            setError(error.message || "Unable to create an account.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
                <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                        <ShieldCheck size={30} />
                    </div>
                </div>

                <h1 className="mt-5 text-center text-2xl font-bold">
                    Create your account
                </h1>

                <p className="mt-2 text-center text-sm text-slate-500">
                    Get started with FormGuard AI.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div>
                        <label
                            htmlFor="register-name"
                            className="mb-2 block text-sm font-medium"
                        >
                            Full name
                        </label>

                        <input
                            id="register-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            autoComplete="name"
                            minLength={2}
                            maxLength={80}
                            required
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                            placeholder="Your name"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="register-email"
                            className="mb-2 block text-sm font-medium"
                        >
                            Email address
                        </label>

                        <input
                            id="register-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            autoComplete="email"
                            maxLength={254}
                            required
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="register-password"
                            className="mb-2 block text-sm font-medium"
                        >
                            Password
                        </label>

                        <input
                            id="register-password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={72}
                            required
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                            placeholder="At least 8 characters"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="register-confirm-password"
                            className="mb-2 block text-sm font-medium"
                        >
                            Confirm password
                        </label>

                        <input
                            id="register-confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={72}
                            required
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                            placeholder="Enter your password again"
                        />
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        className="font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}