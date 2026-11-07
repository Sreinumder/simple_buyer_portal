import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'

import AppHeader from '../components/AppHeader'
import PropertyCard from '../components/PropertyCard'
import {
    addFavourite,
    clearToken,
    getMe,
    listFavourites,
    listProperties,
    removeFavourite,
} from '../lib/api'
import type {
    ApiError,
    Favourite,
    Property,
    PropertyFilters,
    User,
} from '../lib/api'

type FilterForm = {
    q: string
    minPrice: string
    maxPrice: string
    sort: NonNullable<PropertyFilters['sort']>
}

const emptyForm: FilterForm = {
    q: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
}

export default function PropertyPage() {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)
    const [properties, setProperties] = useState<Property[]>([])
    const [favourites, setFavourites] = useState<Favourite[]>([])
    const [form, setForm] = useState<FilterForm>(emptyForm)
    const [filters, setFilters] = useState<PropertyFilters>({ sort: 'newest' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [savingPropertyId, setSavingPropertyId] = useState<number | null>(null)

    const favouriteIds = useMemo(
        () => new Set(favourites.map((item) => item.property_id)),
        [favourites],
    )

    const load = useCallback(
        async (activeFilters: PropertyFilters) => {
            setLoading(true)
            setError('')
            try {
                const me = await getMe()
                const props = await listProperties(activeFilters)
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
        },
        [navigate],
    )

    useEffect(() => {
        void load(filters)
    }, [load, filters])

    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFilters({
            q: form.q || undefined,
            min_price: form.minPrice ? Number(form.minPrice) : undefined,
            max_price: form.maxPrice ? Number(form.maxPrice) : undefined,
            sort: form.sort,
        })
    }

    const clearFilters = () => {
        setForm(emptyForm)
        setFilters({ sort: 'newest' })
    }

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
            setFavourites(await listFavourites())
        } catch (err) {
            const message = (err as ApiError).message
            setError(message)
            toast.error(message)
        } finally {
            setSavingPropertyId(null)
        }
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <AppHeader user={user} current="properties" />

            <section className="mx-auto w-full max-w-6xl px-4 py-6">
                <form
                    onSubmit={applyFilters}
                    className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
                >
                    <label className="block lg:col-span-2">
                        <span className="mb-1 block text-sm text-slate-700">Search</span>
                        <input
                            type="search"
                            placeholder="Name, location, or description"
                            value={form.q}
                            onChange={(event) => setForm({ ...form, q: event.target.value })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-sm text-slate-700">Min price</span>
                        <input
                            type="number"
                            min={0}
                            value={form.minPrice}
                            onChange={(event) => setForm({ ...form, minPrice: event.target.value })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-sm text-slate-700">Max price</span>
                        <input
                            type="number"
                            min={0}
                            value={form.maxPrice}
                            onChange={(event) => setForm({ ...form, maxPrice: event.target.value })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-sm text-slate-700">Sort</span>
                        <select
                            value={form.sort}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    sort: event.target.value as FilterForm['sort'],
                                })
                            }
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
                        >
                            <option value="newest">Newest</option>
                            <option value="price_asc">Price: low to high</option>
                            <option value="price_desc">Price: high to low</option>
                        </select>
                    </label>

                    <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
                        <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                            Apply filters
                        </button>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
                        >
                            Clear
                        </button>
                    </div>
                </form>

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
                            ? 'No listings match. Create a property or clear the filters.'
                            : 'No properties match your search.'}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {properties.map((property) => {
                            const isFavourite = favouriteIds.has(property.id)
                            return (
                                <PropertyCard
                                    key={property.id}
                                    property={property}
                                    footer={
                                        user?.role === 'buyer' ? (
                                            <button
                                                onClick={() =>
                                                    void toggleFavourite(property.id, property.name)
                                                }
                                                disabled={savingPropertyId === property.id}
                                                className={`w-full rounded-md px-3 py-2 text-sm font-medium transition ${
                                                    isFavourite
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
                                            <div className="flex gap-2">
                                                <Link
                                                    to={`/properties/${property.id}/edit`}
                                                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-center text-sm hover:bg-slate-100"
                                                >
                                                    Edit
                                                </Link>
                                                <Link
                                                    to={`/properties/${property.id}`}
                                                    className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-black"
                                                >
                                                    View
                                                </Link>
                                            </div>
                                        )
                                    }
                                />
                            )
                        })}
                    </div>
                )}
            </section>
        </main>
    )
}
