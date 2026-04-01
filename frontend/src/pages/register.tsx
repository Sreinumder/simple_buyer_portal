import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { register } from '../lib/api'
import type { ApiError } from '../lib/api'

export default function RegisterPage() {
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError('')
        setLoading(true)

        try {
            await register({ name, email, password })
            navigate('/login?registered=1')
        } catch (err) {
            setError((err as ApiError).message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Register</h1>
            <p className="mt-2 text-sm text-slate-600">Create your buyer account.</p>

            {error && (
                <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                </p>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <label className="block">
                    <span className="mb-1 block text-sm text-slate-700">Name</span>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
                    />
                </label>

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
                        minLength={8}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
                    />
                </label>

                <button
                    disabled={loading}
                    className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                    {loading ? 'Creating account...' : 'Register'}
                </button>
            </form>

            <p className="mt-4 text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-700 hover:underline">
                    Login
                </Link>
            </p>
        </main>
    )
}
