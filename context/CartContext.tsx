'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CartItemWithProduct, Product } from '@/lib/types'

type CartContextType = {
  items: CartItemWithProduct[]
  cartId: string | null
  loading: boolean
  addToCart: (product: Product, quantity?: number) => Promise<void>
  removeFromCart: (cartItemId: string) => Promise<void>
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  clearCart: () => void
  refreshCart: () => Promise<void>
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemWithProduct[]>([])
  const [cartId, setCartId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const getOrCreateCart = useCallback(async (): Promise<string | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    // Look for an existing pending cart
    const { data: existingCart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingCart) {
      return existingCart.id
    }

    // Create a new pending cart
    const { data: newCart, error } = await supabase
      .from('carts')
      .insert({ user_id: user.id, status: 'pending' })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create cart:', error)
      return null
    }

    return newCart.id
  }, [supabase])

  const refreshCart = useCallback(async () => {
    setLoading(true)
    const currentCartId = await getOrCreateCart()
    setCartId(currentCartId)

    if (!currentCartId) {
      setItems([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('cart_id', currentCartId)

    if (error) {
      console.error('Failed to load cart items:', error)
      setItems([])
    } else {
      setItems((data as CartItemWithProduct[]) ?? [])
    }
    setLoading(false)
  }, [getOrCreateCart, supabase])

  useEffect(() => {
    refreshCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addToCart = async (product: Product, quantity: number = 1) => {
    let currentCartId = cartId
    if (!currentCartId) {
      currentCartId = await getOrCreateCart()
      setCartId(currentCartId)
    }
    if (!currentCartId) return

    const existing = items.find((item) => item.product_id === product.id)

    if (existing) {
      await updateQuantity(existing.id, existing.quantity + quantity)
      return
    }

    const { data, error } = await supabase
      .from('cart_items')
      .insert({
        cart_id: currentCartId,
        product_id: product.id,
        quantity,
      })
      .select('*, product:products(*)')
      .single()

    if (error) {
      console.error('Failed to add to cart:', error)
      return
    }

    setItems((prev) => [...prev, data as CartItemWithProduct])
  }

  const removeFromCart = async (cartItemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)

    if (error) {
      console.error('Failed to remove from cart:', error)
      return
    }

    setItems((prev) => prev.filter((item) => item.id !== cartItemId))
  }

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(cartItemId)
      return
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)

    if (error) {
      console.error('Failed to update quantity:', error)
      return
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        cartId,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
