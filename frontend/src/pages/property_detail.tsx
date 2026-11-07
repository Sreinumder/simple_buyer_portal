import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'

import AppHeader from '../components/AppHeader'
import { formatPrice } from '../lib/format'
import {
    addFavourite,
    clearToken,
    deleteProperty,
    getMe,
    getProperty,
    listFavourites,
    removeFavourite,
} from '../lib/api'
import type { ApiError, Property, User } from '../lib/api'

export default function PropertyDetailPage() {
    const navigate = useNavigate()
    const { propertyId } = useParams()
    const id = Number(propertyId)

    const [user, setUser] = useState<User | null>(null)
    const [property, setProperty] = useState<Property | null>(null)
    const [isFavourite, setIsFavourite] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const me = await getMe()
                const item = await getProperty(id)
                const favs = me.role === 'buyer' ? await listFavourites() : []
                setUser(me)
                setProperty(item)
                setIsFavourite(favs.some((fav) => fav.property_id === id))
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

        if (Number.isFinite(id)) {
            void load()
        } else {
            setError('Property not found')
            setLoading(false)
        }
    }, [id, navigate])

    const toggleFavourite = async () => {
        if (!property) return
        setSaving(true)
        try {
            if (isFavourite) {
                await removeFavourite(property.id)
                toast.success('Removed from favourites')
            } else {
                await addFavourite(property.id)
                toast.success('Added to favourites')
            }
            setIsFavourite(!isFavourite)
        } catch (err) {
            toast.error((err as ApiError).message)
        } finally {
            setSaving(false)
        }
    }

    const removeListing = async () => {
        if (!property) return
        if (!window.confirm(`Delete "${property.name}"? This also removes it from favourites.`)) {
            return
        }

        setSaving(true)
        try {
            await deleteProperty(property.id)
            toast.success('Property deleted')
            navigate('/properties', { replace: true })
        } catch (err) {
            toast.error((err as ApiError).message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <AppHeader user={user} current="properties" />

            <section className="mx-auto w-full max-w-4xl px-4 py-6">
                <Link to="/properties" className="text-sm text-blue-700 hover:underline">
                    ← Back to properties
                </Link>

                {loading ? (
                    <p className="mt-4 text-sm text-slate-600">Loading property...</p>
                ) : error || !property ? (
                    <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {error || 'Property not found'}
                    </p>
                ) : (
                    <article className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        {property.image_url ? (
                            <img
                                src={property.image_url}
                                alt={property.name}
                                className="h-72 w-full object-cover"
                                onError={(event) => {
                                    event.currentTarget.style.display = 'none'
                                }}
                            />
                        ) : (
                            <div className="flex h-52 w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
                                No photo
                            </div>
                        )}

                        <div className="p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h1 className="text-3xl font-semibold text-slate-900">
                                        {property.name}
                                    </h1>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {property.location}
                                    </p>
                                </div>
                                <p className="text-2xl font-semibold text-slate-900">
                                    {formatPrice(property.price)}
                                </p>
                            </div>

                            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-700">
                                {property.description || 'No description provided.'}
                            </p>

                            <p className="mt-4 text-xs text-slate-500">
                                Listed {new Date(property.created_at).toLocaleDateString()}
                            </p>

                            <div className="mt-6 flex flex-wrap gap-2">
                                {user?.role === 'buyer' && (
                                    <button
                                        onClick={() => void toggleFavourite()}
                                        disabled={saving}
                                        className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 ${
                                            isFavourite
                                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                                : 'bg-slate-900 text-white hover:bg-black'
                                        }`}
                                    >
                                        {saving
                                            ? 'Saving...'
                                            : isFavourite
                                              ? 'Remove from favourites'
                                              : 'Add to favourites'}
                                    </button>
                                )}

                                {user?.role === 'seller' && property.created_by_id === user.id && (
                                    <>
                                        <Link
                                            to={`/properties/${property.id}/edit`}
                                            className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
                                        >
                                            Edit listing
                                        </Link>
                                        <button
                                            onClick={() => void removeListing()}
                                            disabled={saving}
                                            className="rounded-md border border-rose-300 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </article>
                )}
            </section>
        </main>
    )
}
