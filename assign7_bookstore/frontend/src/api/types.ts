// The shapes the Spring Boot API returns. These mirror the records in
// web/Dtos.java; note there is no password field anywhere, because the server
// never sends one back.

export interface Book {
  id: string
  isbn: string
  title: string
  author: string
  genre: string
  price: number
  rating: number
  stock: number
  year: number
  blurb: string
  coverColour: string
  inStock: boolean
}

export interface Account {
  id: string
  fullName: string
  email: string
  registeredOn: string
}

export interface SessionResponse {
  account: Account
  token: string
  expiresOn: string
}

export type SortOrder =
  | 'title'
  | 'price-low-high'
  | 'price-high-low'
  | 'rating'
  | 'newest'

export interface CatalogueQuery {
  search?: string
  genre?: string
  maxPrice?: number
  inStockOnly?: boolean
  sort?: SortOrder
}

/** Field name -> the first complaint about it, as the server reported it. */
export type FieldErrors = Record<string, string>
