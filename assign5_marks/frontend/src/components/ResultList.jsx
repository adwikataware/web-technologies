import { useState } from 'react'

export default function ResultList({ results, onOpen }) {
  const [query, setQuery] = useState('')

  const term = query.trim().toLowerCase()
  const visible = term
    ? results.filter(
        (result) => result.name.toLowerCase().includes(term) || result.prn.includes(term),
      )
    : results

  return (
    <div className="card">
      <h2>Saved results</h2>
      <input
        className="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name or PRN"
        aria-label="Search results"
      />

      {visible.length === 0 ? (
        <p className="hint">
          {results.length === 0 ? 'No results saved yet.' : 'Nothing matches that search.'}
        </p>
      ) : (
        <div className="table-scroll">
          <table className="compact">
            <thead>
              <tr>
                <th>PRN</th>
                <th>Name</th>
                <th>Div</th>
                <th>Total</th>
                <th>SGPA</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((result) => (
                <tr
                  key={result.prn}
                  className="clickable"
                  tabIndex={0}
                  onClick={() => onOpen(result)}
                  onKeyDown={(event) => event.key === 'Enter' && onOpen(result)}
                >
                  <td data-label="PRN">{result.prn}</td>
                  <td data-label="Name">{result.name}</td>
                  <td data-label="Division">{result.division}</td>
                  <td data-label="Total">{result.totalMarks}</td>
                  <td data-label="SGPA">{result.sgpa.toFixed(2)}</td>
                  <td data-label="Result">
                    <span className={`status ${result.status === 'PASS' ? 'pass' : 'fail'}`}>
                      {result.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
