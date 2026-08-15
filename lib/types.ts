export type Product = {
  id: string
  name: string
  description: string | null
  category: string | null
  subcategory: string | null
  brand: string | null
  price: number
  sku: string
  drive_file_id: string | null
  tags: string[] | null
  is_hidden_filter_field: boolean
  created_at: string
}

export type Profile = {
  id: string
  full_name: string | null
  phone_number: string | null
  company_name: string | null
  is_admin: boolean
  created_at: string
}

export type Cart = {
  id: string
  user_id: string
  status: string
  created_at: string
}

export type CartItem = {
  id: string
  cart_id: string
  product_id: string
  quantity: number
  created_at: string
  product?: Product
}

export type CartItemWithProduct = CartItem & {
  product: Product
}

export function getProductImageUrl(driveFileId: string | null): string {
  if (!driveFileId) {
    return '/placeholder-product.png'
  }
  return `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000`
}
