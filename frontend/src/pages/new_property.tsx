import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'

import AppHeader from '../components/AppHeader'
import PropertyForm from '../components/PropertyForm'
import { clearToken, createProperty, getMe } from '../lib/api'
import type { ApiError, PropertyInput, User } from '../lib/api'

export default function NewPropertyPage() {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)
    const [error, setError] = useState('')
    const [checkingRole, setCheckingRole] = useState(true)

    useEffect(() => {
        const loadUser = async () => {
            try {
                const me = await getMe()
                setUser(me)
                if (me.role !== 'seller') {
                    setError('Only seller accounts can create properties.')
                }
            } catch (err) {
                const apiError = err as ApiError
                if (apiError.status === 401) {
                    clearToken()
                    navigate('/login', { replace: true })
                } else {
                    setError(apiError.message)
                }
            } finally {
                setCheckingRole(false)
            }
        }

        void loadUser()
    }, [navigate])

    const save = async (values: PropertyInput) => {
        const created = await createProperty(values)
        toast.success(`Created "${created.name}"`)
        navigate(`/properties/${created.id}`)
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <AppHeader user={user} current="properties" />

            <section className="mx-auto w-full max-w-2xl px-4 py-8">
                <Link to="/properties" className="text-sm text-blue-700 hover:underline">
                    ← Back to properties
                </Link>
                <h1 className="mb-4 mt-2 text-2xl font-semibold text-slate-900">Create property</h1>

                {checkingRole ? (
                    <p className="text-sm text-slate-600">Checking access...</p>
                ) : error ? (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                        {error}
                    </p>
                ) : (
                    <PropertyForm submitLabel="Create property" onSubmit={save} />
                )}
            </section>
        </main>
    )
}
