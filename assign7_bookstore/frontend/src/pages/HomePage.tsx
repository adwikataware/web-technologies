import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Book } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import BookCard from '../components/BookCard'

const PROMISES = [
  { title: 'Next-day delivery', copy: 'Ordered before 6pm ships the same evening, anywhere in Maharashtra.' },
  { title: 'Campus pickup', copy: 'Collect from the VIT Pune counter and skip the delivery fee entirely.' },
  { title: 'Returns for 30 days', copy: 'Wrong edition, or simply not for you? Send it back, no questions.' }
]

export default function HomePage() {
  const { account } = useAuth()
  const [featured, setFeatured] = useState<Book[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // The four best-rated titles that are actually on the shelf.
    api.books({ sort: 'rating', inStockOnly: true })
      .then((books) => setFeatured(books.slice(0, 4)))
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Independent bookshop · Pune</p>
          <h1>
            Books worth <em>keeping</em> on the shelf.
          </h1>
          <p className="lede">
            A small, opinionated catalogue — computing, history, philosophy and
            fiction — picked one title at a time rather than by what an algorithm
            says is trending.
          </p>
          <div className="hero-actions">
            <Link to="/catalogue" className="btn btn-primary btn-lg">
              Browse the catalogue
            </Link>
            {!account && (
              <Link to="/register" className="btn btn-outline btn-lg">
                Create an account
              </Link>
            )}
          </div>
          {account && (
            <p className="hero-welcome">
              Signed in as <strong>{account.email}</strong> — your orders will be
              saved to this account.
            </p>
          )}
        </div>

        <div className="hero-stack" aria-hidden="true">
          <span className="stack-book stack-1">Clean Code</span>
          <span className="stack-book stack-2">Sapiens</span>
          <span className="stack-book stack-3">Meditations</span>
        </div>
      </section>

      <section className="promises">
        {PROMISES.map((promise) => (
          <article key={promise.title} className="promise">
            <h2>{promise.title}</h2>
            <p>{promise.copy}</p>
          </article>
        ))}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Highest rated right now</h2>
          <Link to="/catalogue" className="section-link">See all titles →</Link>
        </div>

        {error && <p className="alert alert-error">{error}</p>}

        {!error && featured.length === 0 && (
          <div className="book-grid">
            {[0, 1, 2, 3].map((n) => <div key={n} className="book-skeleton" />)}
          </div>
        )}

        <div className="book-grid">
          {featured.map((book) => <BookCard key={book.id} book={book} />)}
        </div>
      </section>
    </>
  )
}
