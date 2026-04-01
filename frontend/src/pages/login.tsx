import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { login } from '../lib/api'
import type { ApiError } from '../lib/api'

export default function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError('')
        setLoading(true)

        try {
            await login({ email, password })
            navigate('/properties', { replace: true })
        } catch (err) {
            setError((err as ApiError).message)
        } finally {
            setLoading(false)
        }
    }

    const justRegistered = new URLSearchParams(location.search).get('registered') === '1'

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Login</h1>
            <p className="mt-2 text-sm text-slate-600">Use your buyer account to continue.</p>

            {justRegistered && (
                <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    Registration successful. Please login.
                </p>
            )}

            {error && (
                <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                </p>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <label className="block">
                    <span className="mb-1 block text-sm text-slate-700">Email</span>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
                    />
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm text-slate-700">Password</span>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
                    />
                </label>

                <button
                    disabled={loading}
                    className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                    {loading ? 'Signing in...' : 'Login'}
                </button>
            </form>

            <p className="mt-4 text-sm text-slate-600">
                No account?{' '}
                <Link to="/register" className="font-medium text-blue-700 hover:underline">
                    Register here
                </Link>
            </p>
        </main>
    )
}
