import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { clearToken } from '../lib/api'
import type { User } from '../lib/api'

type Props = {
    user: User | null
    current?: 'properties' | 'favourite'
}

export default function AppHeader({ user, current }: Props) {
    const navigate = useNavigate()

    const logout = () => {
        clearToken()
        toast.success('Logged out')
        navigate('/login', { replace: true })
    }

    const linkClass = (active: boolean) =>
        `rounded-md px-3 py-2 ${active ? 'bg-slate-900 text-white' : 'border border-slate-300 hover:bg-slate-100'}`

    return (
        <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
                <div>
                    <Link to="/properties" className="text-2xl font-semibold text-slate-900">
                        Buyer Portal
                    </Link>
                    {user && (
                        <p className="text-sm text-slate-600">
                            {user.name} · {user.role}
                        </p>
                    )}
                </div>

                <nav className="flex flex-wrap items-center gap-2 text-sm">
                    <Link to="/properties" className={linkClass(current === 'properties')}>
                        Properties
                    </Link>
                    {user?.role === 'buyer' && (
                        <Link to="/favourite" className={linkClass(current === 'favourite')}>
                            Favourites
                        </Link>
                    )}
                    {user?.role === 'seller' && (
                        <Link to="/new_property" className={linkClass(false)}>
                            New property
                        </Link>
                    )}
                    <button
                        onClick={logout}
                        className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-100"
                    >
                        Logout
                    </button>
                </nav>
            </div>
        </header>
    )
}
