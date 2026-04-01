import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'

import {
    addFavourite,
    clearToken,
    getMe,
    listFavourites,
    listProperties,
    removeFavourite,
} from '../lib/api'
import type { ApiError, Favourite, Property, User } from '../lib/api'

export default function PropertyPage() {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)
    const [properties, setProperties] = useState<Property[]>([])
    const [favourites, setFavourites] = useState<Favourite[]>([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [savingPropertyId, setSavingPropertyId] = useState<number | null>(null)

    const favouriteIds = useMemo(() => new Set(favourites.map((f) => f.property_id)), [favourites])

    const loadData = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const me = await getMe()
            const props = await listProperties()
            const favs = me.role === 'buyer' ? await listFavourites() : []
            setUser(me)
            setProperties(props)
            setFavourites(favs)
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message)
            toast.error(apiError.message)
            if (apiError.status === 401) {
                clearToken()
                navigate('/login', { replace: true })
            }
        } finally {
            setLoading(false)
        }
    }, [navigate])

    useEffect(() => {
        void loadData()
    }, [loadData])

    const toggleFavourite = async (propertyId: number, propertyName: string) => {
        setSavingPropertyId(propertyId)
        setError('')
        try {
            if (favouriteIds.has(propertyId)) {
                await removeFavourite(propertyId)
                toast.success(`Removed "${propertyName}" from favourites`)
            } else {
                await addFavourite(propertyId)
                toast.success(`Added "${propertyName}" to favourites`)
            }
            const favs = await listFavourites()
            setFavourites(favs)
        } catch (err) {
            const message = (err as ApiError).message
            setError(message)
            toast.error(message)
        } finally {
            setSavingPropertyId(null)
        }
    }

    const logout = () => {
        toast.success('Logged out successfully')
        clearToken()
        navigate('/login', { replace: true })
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Properties</h1>
                        {user && (
                            <p className="text-sm text-slate-600">
                                Signed in as {user.name} ({user.role})
                            </p>
                        )}
                    </div>
                    <nav className="flex items-center gap-2 text-sm">
                        {user?.role === 'seller' && (
                            <Link className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-100" to="/new_property">
                                New property
                            </Link>
                        )}
                        {user?.role === 'buyer' && (
                            <Link className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-100" to="/favourite">
                                My favourites
                            </Link>
                        )}
                        <button
                            onClick={logout}
                            className="rounded-md bg-slate-900 px-3 py-2 font-medium text-white hover:bg-black"
                        >
                            Logout
                        </button>
                    </nav>
                </div>
            </header>

            <section className="mx-auto w-full max-w-6xl px-4 py-6">
                {error && (
                    <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {error}
                    </p>
                )}

                {loading ? (
                    <p className="text-sm text-slate-600">Loading properties...</p>
                ) : properties.length === 0 ? (
                    <p className="text-sm text-slate-600">
                        {user?.role === 'seller'
                            ? 'No properties found. Create your first property.'
                            : 'No properties available right now.'}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {properties.map((property) => {
                            const isFavourite = favouriteIds.has(property.id)
                            return (
                                <article
                                    key={property.id}
                                    className="flex flex-col h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <h2 className="text-lg font-semibold text-slate-900">
                                            {property.name}
                                        </h2>
                                    </div>

                                    <p className="mt-2 mb-4 text-sm leading-6 text-slate-600">
                                        {property.description || 'No description provided.'}
                                    </p>
                                    <p className="mb-1 text-sm text-slate-700">
                                        <span className="font-medium">Location:</span> {property.location}
                                    </p>
                                    <p className="mb-4 text-sm text-slate-700">
                                        <span className="font-medium">Price:</span> ${property.price.toLocaleString()}
                                    </p>

                                    {user?.role === 'buyer' ? (
                                        <button
                                            onClick={() => void toggleFavourite(property.id, property.name)}
                                            disabled={savingPropertyId === property.id}
                                            className={`mt-auto w-full rounded-md px-3 py-2 text-sm font-medium transition ${isFavourite
                                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                                : 'bg-slate-900 text-white hover:bg-black'
                                                } disabled:opacity-60`}
                                        >
                                            {savingPropertyId === property.id
                                                ? 'Saving...'
                                                : isFavourite
                                                    ? 'Remove from favourites'
                                                    : 'Add to favourites'}
                                        </button>
                                    ) : (
                                        <p className="mt-auto rounded-md bg-slate-100 px-3 py-2 text-center text-sm text-slate-600">
                                            Shared by you
                                        </p>
                                    )}
                                </article>
                            )
                        })}
                    </div>
                )}
            </section>
        </main>
    )
}
