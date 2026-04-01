import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { createProperty } from '../lib/api'
import type { ApiError } from '../lib/api'

export default function NewPropertyPage() {
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError('')
        setLoading(true)

        try {
            await createProperty({ name, description })
            navigate('/properties')
        } catch (err) {
            setError((err as ApiError).message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">Create property</h1>
                <Link to="/properties" className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
                    Back
                </Link>
            </div>

            {error && (
                <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                </p>
            )}

            <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <label className="block">
                    <span className="mb-1 block text-sm text-slate-700">Property name</span>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
                    />
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm text-slate-700">Description</span>
                    <textarea
                        rows={5}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
                    />
                </label>

                <button
                    disabled={loading}
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                    {loading ? 'Creating...' : 'Create property'}
                </button>
            </form>
        </main>
    )
}
