import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import type { Book, SortOrder } from '../api/types'
import BookCard, { rupees } from '../components/BookCard'

const SORTS: { value: SortOrder; label: string }[] = [
  { value: 'title', label: 'Title (A–Z)' },
  { value: 'price-low-high', label: 'Price: low to high' },
  { value: 'price-high-low', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'newest', label: 'Newest first' }
]

const PRICE_CEILING = 1300

export default function CataloguePage() {
  const [books, setBooks] = useState<Book[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('All')
  const [maxPrice, setMaxPrice] = useState(PRICE_CEILING)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sort, setSort] = useState<SortOrder>('title')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.genres().then(setGenres).catch(() => setGenres([]))
  }, [])

  // Typing in the search box should not fire a request per keystroke.
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 250)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    api.books({
      search: debounced,
      genre,
      maxPrice: maxPrice < PRICE_CEILING ? maxPrice : undefined,
      inStockOnly,
      sort
    })
      .then((result) => {
        // A slower earlier request must not overwrite a newer result.
        if (!cancelled) { setBooks(result); setError(null) }
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [debounced, genre, maxPrice, inStockOnly, sort])

  const filtered = useMemo(
    () => genre !== 'All' || debounced || inStockOnly || maxPrice < PRICE_CEILING,
    [genre, debounced, inStockOnly, maxPrice]
  )

  const reset = () => {
    setSearch(''); setGenre('All'); setMaxPrice(PRICE_CEILING)
    setInStockOnly(false); setSort('title')
  }

  return (
    <section className="catalogue">
      <header className="catalogue-head">
        <div>
          <h1>Catalogue</h1>
          <p className="lede">
            {loading ? 'Loading titles…' : `${books.length} title${books.length === 1 ? '' : 's'}`}
            {filtered && !loading && ' matching your filters'}
          </p>
        </div>

        <label className="search" htmlFor="catalogue-search">
          <span className="sr-only">Search by title or author</span>
          <input
            id="catalogue-search"
            type="search"
            placeholder="Search by title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </header>

      <div className="catalogue-body">
        <aside className="filters">
          <div className="filter-group">
            <h2>Genre</h2>
            <div className="genre-list">
              {['All', ...genres].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`genre-btn${genre === option ? ' is-active' : ''}`}
                  onClick={() => setGenre(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h2>
              <label htmlFor="max-price">Up to {rupees(maxPrice)}</label>
            </h2>
            <input
              id="max-price"
              type="range"
              min={200}
              max={PRICE_CEILING}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
          </div>

          <div className="filter-group">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              In stock only
            </label>
          </div>

          <div className="filter-group">
            <h2><label htmlFor="sort-by">Sort by</label></h2>
            <select
              id="sort-by"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOrder)}
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {filtered && (
            <button type="button" className="btn btn-outline btn-block" onClick={reset}>
              Clear filters
            </button>
          )}
        </aside>

        <div className="catalogue-results">
          {error && <p className="alert alert-error">{error}</p>}

          {loading && (
            <div className="book-grid">
              {[0, 1, 2, 3, 4, 5].map((n) => <div key={n} className="book-skeleton" />)}
            </div>
          )}

          {!loading && !error && books.length === 0 && (
            <div className="empty">
              <h2>No titles match those filters</h2>
              <p>Try a broader price range, or clear the filters and start again.</p>
              <button type="button" className="btn btn-primary" onClick={reset}>
                Clear filters
              </button>
            </div>
          )}

          {!loading && books.length > 0 && (
            <div className="book-grid">
              {books.map((book) => <BookCard key={book.id} book={book} />)}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
