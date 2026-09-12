import type { Book } from '../api/types'

export const rupees = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount)

/** Five stars with the fractional one shown as a partial fill. */
function Stars({ rating }: { rating: number }) {
  const percent = Math.round((rating / 5) * 100)
  return (
    <span className="stars" title={`${rating.toFixed(1)} out of 5`}>
      <span className="stars-empty" aria-hidden="true">★★★★★</span>
      <span className="stars-full" style={{ width: `${percent}%` }} aria-hidden="true">
        ★★★★★
      </span>
      <span className="stars-value">{rating.toFixed(1)}</span>
    </span>
  )
}

export default function BookCard({ book }: { book: Book }) {
  return (
    <article className={`book-card${book.inStock ? '' : ' is-out'}`}>
      <div className="book-cover" style={{ background: book.coverColour }}>
        <span className="book-cover-title">{book.title}</span>
        <span className="book-cover-author">{book.author}</span>
        {!book.inStock && <span className="book-badge">Out of stock</span>}
      </div>

      <div className="book-body">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>
        <p className="book-blurb">{book.blurb}</p>

        <div className="book-meta">
          <span className="chip">{book.genre}</span>
          <span className="chip chip-quiet">{book.year}</span>
        </div>

        <div className="book-foot">
          <Stars rating={book.rating} />
          <span className="book-price">{rupees(book.price)}</span>
        </div>

        <button type="button" className="btn btn-primary btn-block" disabled={!book.inStock}>
          {book.inStock ? `Add to bag · ${book.stock} left` : 'Notify me'}
        </button>
      </div>
    </article>
  )
}
