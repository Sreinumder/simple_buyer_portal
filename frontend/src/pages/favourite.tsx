import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import AppHeader from '../components/AppHeader'
import PropertyCard from '../components/PropertyCard'
import {
    clearToken,
    getMe,
    listFavouriteProperties,
    removeFavourite,
} from '../lib/api'
import type { ApiError, Property, User } from '../lib/api'

export default function FavouritePage() {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)
    const [properties, setProperties] = useState<Property[]>([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [removingId, setRemovingId] = useState<number | null>(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const me = await getMe()
                if (me.role !== 'buyer') {
                    setError('Only buyers can view favourites.')
                    return
                }
                setUser(me)
                setProperties(await listFavouriteProperties())
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

    const remove = async (property: Property) => {
        setRemovingId(property.id)
        try {
            await removeFavourite(property.id)
            setProperties((current) => current.filter((item) => item.id !== property.id))
            toast.success(`Removed "${property.name}"`)
        } catch (err) {
            toast.error((err as ApiError).message)
        } finally {
            setRemovingId(null)
        }
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <AppHeader user={user} current="favourite" />

            <section className="mx-auto w-full max-w-6xl px-4 py-6">
                <h1 className="mb-4 text-2xl font-semibold text-slate-900">My favourites</h1>

                {error && (
                    <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {error}
                    </p>
                )}

                {loading ? (
                    <p className="text-sm text-slate-600">Loading favourites...</p>
                ) : properties.length === 0 ? (
                    <p className="text-sm text-slate-600">
                        You have not favourited any properties yet.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {properties.map((property) => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                footer={
                                    <button
                                        onClick={() => void remove(property)}
                                        disabled={removingId === property.id}
                                        className="w-full rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                                    >
                                        {removingId === property.id
                                            ? 'Removing...'
                                            : 'Remove from favourites'}
                                    </button>
                                }
                            />
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}
