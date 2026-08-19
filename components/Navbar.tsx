'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/context/CartContext'
import CartDrawer from './CartDrawer'
import FAQModal from './FAQModal'
import ContactModal from './ContactModal'
import type { Profile } from '@/lib/types'
import type { SortOption } from './ProductGrid'
import { useCurrency } from '@/context/CurrencyContext'
export default function Navbar({
  profile,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
}: {
  profile: Profile | null
  search: string
  onSearchChange: (value: string) => void
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
}) {
  const router = useRouter()
  const supabase = createClient()
  const { itemCount } = useCart()
  const { currency, setCurrency } = useCurrency()
  const [cartOpen, setCartOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const isAdmin = profile?.is_admin ?? false
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }
  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Upload your logo file to public/logo.png in GitHub -- falls back to text until then */}
          {!logoError && (
            <img
              src="/logo.png"
              alt="Logo"
              className="h-[4.5rem] w-auto object-contain"
              onError={() => setLogoError(true)}
            />
          )}
          <span className="text-lg font-semibold text-gray-900">
            Product Catalog
          </span>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-xl min-w-[220px]">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by SKU..."
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="newest">Newest First</option>
            <option value="sku_asc">SKU (A–Z)</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'USD' | 'INR')}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="USD">$ USD</option>
            <option value="INR">₹ INR</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          {profile?.full_name && (
            <span className="hidden sm:inline text-sm text-gray-600">
              Hi, {profile.full_name}
            </span>
          )}
          {isAdmin && (
            <Link
              href="/admin/clients"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Client Management
            </Link>
          )}
          <button
            onClick={() => setFaqOpen(true)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            FAQ
          </button>
          <button
            onClick={() => setContactOpen(true)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Contact Us
          </button>
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
      {faqOpen && <FAQModal onClose={() => setFaqOpen(false)} />}
      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
    </>
  )
}
