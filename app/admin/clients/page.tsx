'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCurrency } from '@/context/CurrencyContext'
import { formatUSD, formatINR } from '@/lib/currency'

// NOTE: protect /admin/* routes (middleware or a layout-level check) so only
// users with profiles.is_admin = true can reach this page.

type ClientProfile = {
  id: string
  full_name: string | null
  phone_number: string | null
  company_name: string | null
  created_at: string
  is_admin: boolean
}

type CartItemRow = {
  id: string
  quantity: number
  product: {
    sku: string
    name: string
    price: number
  } | null
}

type CartRow = {
  id: string
  status: string
  created_at: string
  cart_items: CartItemRow[]
}

export default function ClientManagementPage() {
  const supabase = createClient()
  const { rate } = useCurrency()

  const [clients, setClients] = useState<ClientProfile[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [carts, setCarts] = useState<CartRow[]>([])
  const [loadingCarts, setLoadingCarts] = useState(false)
  const [search, setSearch] = useState('')

  // Load every registered (non-admin) client
  useEffect(() => {
    async function loadClients() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number, company_name, created_at, is_admin')
        .eq('is_admin', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load clients:', error)
      } else {
        setClients(data ?? [])
      }
      setLoadingClients(false)
    }
    loadClients()
  }, [])

  // Load the selected client's carts (pending = current cart, submitted = order history)
  useEffect(() => {
    if (!selectedId) {
      setCarts([])
      return
    }

    async function loadCarts() {
      setLoadingCarts(true)
      const { data, error } = await supabase
        .from('carts')
        .select('id, status, created_at, cart_items(id, quantity, product:products(sku, name, price))')
        .eq('user_id', selectedId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load carts:', error)
        setCarts([])
      } else {
        setCarts((data as unknown as CartRow[]) ?? [])
      }
      setLoadingCarts(false)
    }
    loadCarts()
  }, [selectedId])

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      (c.full_name ?? '').toLowerCase().includes(q) ||
      (c.phone_number ?? '').toLowerCase().includes(q) ||
      (c.company_name ?? '').toLowerCase().includes(q)
    )
  })

  const selectedClient = clients.find((c) => c.id === selectedId) ?? null
  const currentCart = carts.find((c) => c.status === 'pending')
  const pastOrders = carts.filter((c) => c.status === 'submitted')

  function cartTotal(cart: CartRow) {
    return cart.cart_items.reduce(
      (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
      0
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Client Management</h1>
        <p className="text-sm text-gray-500 mb-6">
          Registered client profiles, current carts, and order history.
        </p>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Client list */}
          <div className="lg:w-80 flex-shrink-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or company..."
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />

            {loadingClients && <p className="text-sm text-gray-400">Loading clients...</p>}

            <div className="space-y-1 max-h-[70vh] overflow-y-auto">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedId(client.id)}
                  className={`w-full text-left px-3 py-2 rounded-md border ${
                    selectedId === client.id
                      ? 'border-gray-900 bg-white'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {client.full_name || 'Unnamed client'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {client.company_name || client.phone_number || '—'}
                  </p>
                </button>
              ))}
              {!loadingClients && filteredClients.length === 0 && (
                <p className="text-sm text-gray-400">No clients found.</p>
              )}
            </div>
          </div>

          {/* Detail pane */}
          <div className="flex-1 min-w-0">
            {!selectedClient && (
              <p className="text-sm text-gray-400">Select a client to view their details.</p>
            )}

            {selectedClient && (
              <div className="space-y-6">
                {/* Profile */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Profile</h2>
                  <dl className="grid grid-cols-2 gap-y-1 text-sm">
                    <dt className="text-gray-500">Name</dt>
                    <dd className="text-gray-900">{selectedClient.full_name || '—'}</dd>
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="text-gray-900">{selectedClient.phone_number || '—'}</dd>
                    <dt className="text-gray-500">Company</dt>
                    <dd className="text-gray-900">{selectedClient.company_name || '—'}</dd>
                    <dt className="text-gray-500">Registered</dt>
                    <dd className="text-gray-900">
                      {new Date(selectedClient.created_at).toLocaleDateString()}
                    </dd>
                  </dl>
                </div>

                {loadingCarts && <p className="text-sm text-gray-400">Loading cart data...</p>}

                {/* Current cart */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Current Cart</h2>
                  {!currentCart || currentCart.cart_items.length === 0 ? (
                    <p className="text-sm text-gray-400">No items in cart.</p>
                  ) : (
                    <div className="space-y-2">
                      {currentCart.cart_items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.product?.sku ?? 'Unknown SKU'} × {item.quantity}
                          </span>
                          {item.product && (
                            <span className="text-gray-500">
                              {formatUSD(item.product.price * item.quantity)} /{' '}
                              {formatINR(item.product.price * item.quantity, rate)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order history */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">Order History</h2>
                  {pastOrders.length === 0 && (
                    <p className="text-sm text-gray-400">No past orders.</p>
                  )}
                  <div className="space-y-4">
                    {pastOrders.map((order) => (
                      <div key={order.id} className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{new Date(order.created_at).toLocaleString()}</span>
                          <span>
                            {formatUSD(cartTotal(order))} / {formatINR(cartTotal(order), rate)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {order.cart_items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-700">
                                {item.product?.sku ?? 'Unknown SKU'} × {item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
