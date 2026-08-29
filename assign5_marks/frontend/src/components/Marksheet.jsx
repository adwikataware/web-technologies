/** The prepared result sheet, exactly as the server computed it. */
export default function Marksheet({ result, onClose, onDelete }) {
  return (
    <div className="card sheet">
      <header className="sheet-head">
        <div>
          <h2>{result.name}</h2>
          <p className="hint">
            {result.prn} · {result.branch} · Division {result.division}
          </p>
        </div>
        <span className={`status ${result.status === 'PASS' ? 'pass' : 'fail'}`}>
          {result.status}
        </span>
      </header>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Cr.</th>
              <th>MSE</th>
              <th>ESE</th>
              <th>Total</th>
              <th>Grade</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {result.subjects.map((subject) => (
              <tr key={subject.code} className={subject.passed ? '' : 'row-fail'}>
                <td className="subject-cell" data-label="Subject">
                  <span className="subject-code">{subject.code}</span>
                  {subject.name}
                </td>
                <td data-label="Credits">{subject.credits}</td>
                <td data-label="MSE">{subject.mse}</td>
                <td data-label="ESE">{subject.ese}</td>
                <td data-label="Total">{subject.total}</td>
                <td data-label="Grade">
                  <span className={`grade${subject.passed ? '' : ' grade-fail'}`} title={subject.gradeLabel}>
                    {subject.grade}
                  </span>
                </td>
                <td data-label="Points">{subject.gradePoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="summary">
        <Stat label="Total marks" value={`${result.totalMarks} / ${result.maxMarks}`} />
        <Stat label="Percentage" value={`${result.percentage.toFixed(2)}%`} />
        <Stat label="Credits" value={result.totalCredits} />
        <Stat label="SGPA" value={result.sgpa.toFixed(2)} />
      </dl>

      <div className="actions">
        <button type="button" className="ghost" onClick={onClose}>
          Back
        </button>
        <button type="button" className="ghost" onClick={() => window.print()}>
          Print
        </button>
        <button type="button" className="danger" onClick={() => onDelete(result.prn)}>
          Delete
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
