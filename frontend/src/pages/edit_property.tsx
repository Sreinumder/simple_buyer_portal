import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'

import AppHeader from '../components/AppHeader'
import PropertyForm from '../components/PropertyForm'
import { clearToken, getMe, getProperty, updateProperty } from '../lib/api'
import type { ApiError, Property, PropertyInput, User } from '../lib/api'

export default function EditPropertyPage() {
    const navigate = useNavigate()
    const { propertyId } = useParams()
    const id = Number(propertyId)

    const [user, setUser] = useState<User | null>(null)
    const [property, setProperty] = useState<Property | null>(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const me = await getMe()
                if (me.role !== 'seller') {
                    setError('Only seller accounts can edit properties.')
                    return
                }
                const item = await getProperty(id)
                setUser(me)
                setProperty(item)
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

    const save = async (values: PropertyInput) => {
        await updateProperty(id, values)
        toast.success('Property updated')
        navigate(`/properties/${id}`)
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <AppHeader user={user} current="properties" />

            <section className="mx-auto w-full max-w-2xl px-4 py-8">
                <Link to={`/properties/${id}`} className="text-sm text-blue-700 hover:underline">
                    ← Back to property
                </Link>
                <h1 className="mb-4 mt-2 text-2xl font-semibold text-slate-900">Edit property</h1>

                {loading ? (
                    <p className="text-sm text-slate-600">Loading property...</p>
                ) : error || !property ? (
                    <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {error || 'Property not found'}
                    </p>
                ) : (
                    <PropertyForm initial={property} submitLabel="Save changes" onSubmit={save} />
                )}
            </section>
        </main>
    )
}
