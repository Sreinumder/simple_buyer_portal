import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { createProperty, getMe } from '../lib/api'
import type { ApiError, User } from '../lib/api'

export default function NewPropertyPage() {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [location, setLocation] = useState('')
    const [price, setPrice] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [checkingRole, setCheckingRole] = useState(true)

    useEffect(() => {
        const loadUser = async () => {
            try {
                const me = await getMe()
                setUser(me)
            } catch {
                navigate('/login', { replace: true })
            } finally {
                setCheckingRole(false)
            }
        }

        void loadUser()
    }, [navigate])

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError('')
        setLoading(true)

        try {
            await createProperty({
                name,
                description,
                location,
                price: Number(price),
            })
            toast.success(`Created ${name} property successfully`)
            navigate('/properties')
        } catch (err) {
            const message = (err as ApiError).message
            setError(message)
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    if (checkingRole) {
        return (
            <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8">
                <p className="text-sm text-slate-600">Checking access...</p>
            </main>
        )
    }

    if (user?.role !== 'seller') {
        return (
            <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-slate-900">Create property</h1>
                    <Link to="/properties" className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
                        Back
                    </Link>
                </div>
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    Only seller accounts can create properties.
                </p>
            </main>
        )
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

                <label className="block">
                    <span className="mb-1 block text-sm text-slate-700">Location</span>
                    <input
                        type="text"
                        required
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
                    />
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm text-slate-700">Price</span>
                    <input
                        type="number"
                        required
                        min={1}
                        step="0.01"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
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
