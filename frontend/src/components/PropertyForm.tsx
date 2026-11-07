import { useState } from 'react'
import type { FormEvent } from 'react'
import toast from 'react-hot-toast'

import type { ApiError, Property, PropertyInput } from '../lib/api'

type Props = {
    initial?: Property
    submitLabel: string
    onSubmit: (values: PropertyInput) => Promise<void>
}

export default function PropertyForm({ initial, submitLabel, onSubmit }: Props) {
    const [name, setName] = useState(initial?.name ?? '')
    const [description, setDescription] = useState(initial?.description ?? '')
    const [location, setLocation] = useState(initial?.location ?? '')
    const [price, setPrice] = useState(initial ? String(initial.price) : '')
    const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError('')
        setLoading(true)

        try {
            await onSubmit({
                name,
                description: description || undefined,
                location,
                price: Number(price),
                image_url: imageUrl || undefined,
            })
        } catch (err) {
            const message = (err as ApiError).message
            setError(message)
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {error && (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                </p>
            )}

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

            <div className="grid gap-4 sm:grid-cols-2">
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
                    <span className="mb-1 block text-sm text-slate-700">Price (NPR)</span>
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
            </div>

            <label className="block">
                <span className="mb-1 block text-sm text-slate-700">Photo URL (optional)</span>
                <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-blue-500 focus:ring"
                />
            </label>

            <button
                disabled={loading}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
                {loading ? 'Saving...' : submitLabel}
            </button>
        </form>
    )
}
