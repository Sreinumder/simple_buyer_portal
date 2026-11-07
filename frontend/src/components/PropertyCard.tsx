import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import type { Property } from '../lib/api'
import { formatPrice } from '../lib/format'

type Props = {
    property: Property
    footer?: ReactNode
}

export default function PropertyCard({ property, footer }: Props) {
    const [imageFailed, setImageFailed] = useState(false)
    const showImage = property.image_url && !imageFailed

    return (
        <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <Link to={`/properties/${property.id}`} className="block">
                {showImage ? (
                    <img
                        src={property.image_url ?? ''}
                        alt={property.name}
                        className="h-44 w-full object-cover"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
                        No photo
                    </div>
                )}
            </Link>

            <div className="flex flex-1 flex-col p-4">
                <Link to={`/properties/${property.id}`} className="text-lg font-semibold text-slate-900 hover:underline">
                    {property.name}
                </Link>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                    {property.description || 'No description provided.'}
                </p>
                <p className="mt-3 text-sm text-slate-700">
                    <span className="font-medium">Location:</span> {property.location}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                    <span className="font-medium">Price:</span> {formatPrice(property.price)}
                </p>
                {footer && <div className="mt-4">{footer}</div>}
            </div>
        </article>
    )
}
