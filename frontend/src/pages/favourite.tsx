import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { clearToken, getMe, listFavouriteProperties } from '../lib/api'
import type { ApiError, Property } from '../lib/api'

export default function FavouritePage() {
    const navigate = useNavigate()
    const [properties, setProperties] = useState<Property[]>([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const me = await getMe()
                if (me.role !== 'buyer') {
                    setError('Only buyers can view favourites.')
                    setProperties([])
                    return
                }
                const data = await listFavouriteProperties()
                setProperties(data)
            } catch (err) {
                const apiError = err as ApiError
                setError(apiError.message)
                if (apiError.status === 401) {
                    clearToken()
                    navigate('/login', { replace: true })
                }
            } finally {
                setLoading(false)
            }
        }

        void load()
    }, [navigate])

    return (
        <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-slate-900">My favourites</h1>
                <Link to="/properties" className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">
                    Back to properties
                </Link>
            </div>

            {error && (
                <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                </p>
            )}

            {loading ? (
                <p className="text-sm text-slate-600">Loading favourites...</p>
            ) : properties.length === 0 ? (
                <p className="text-sm text-slate-600">You have not favourited any properties yet.</p>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {properties.map((property) => (
                        <article
                            key={property.id}
                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <h2 className="text-lg font-semibold text-slate-900">{property.name}</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                {property.description || 'No description provided.'}
                            </p>
                            <p className="mt-2 text-sm text-slate-700">
                                <span className="font-medium">Location:</span> {property.location}
                            </p>
                            <p className="mt-1 text-sm text-slate-700">
                                <span className="font-medium">Price:</span> ${property.price.toLocaleString()}
                            </p>
                        </article>
                    ))}
                </div>
            )}
        </main>
    )
}
