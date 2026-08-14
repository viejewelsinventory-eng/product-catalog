'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/context/CartContext'
import CartDrawer from './CartDrawer'
import type { Profile } from '@/lib/types'

export default function Navbar({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const supabase = createClient()
  const { itemCount } = useCart()
  const [cartOpen, setCartOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="text-lg font-semibold text-gray-900">
          Product Catalog
        </div>

        <div className="flex items-center gap-4">
          {profile?.full_name && (
            <span className="hidden sm:inline text-sm text-gray-600">
              Hi, {profile.full_name}
            </span>
          )}

          <button
            onClick={() => setCartOpen(true)}
            className="relative bg-gray-900 text-white text-sm rounded-md px-4 py-2 hover:bg-gray-800"
          >
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Log out
          </button>
        </div>
      </nav>

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        profile={profile}
      />
    </>
  )
}
