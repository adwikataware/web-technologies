import { useMemo, useState } from 'react'
import { previewResult } from '../grading.js'

const BLANK_STUDENT = { prn: '', name: '', branch: 'Computer Engineering', division: 'A' }

export default function MarksForm({ syllabus, onSave, saving }) {
  const [student, setStudent] = useState(BLANK_STUDENT)
  const [marks, setMarks] = useState(() => syllabus.subjects.map(() => ({ mse: '', ese: '' })))
  const [errors, setErrors] = useState({})

  const preview = useMemo(() => {
    const rows = syllabus.subjects.map((subject, index) => ({ ...subject, ...marks[index] }))
    return previewResult(rows, syllabus.grades, syllabus)
  }, [marks, syllabus])

  function setMark(index, field, value) {
    setMarks((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  function validate() {
    const found = {}
    if (!/^\d{8,12}$/.test(student.prn.trim())) found.prn = 'PRN must be 8 to 12 digits'
    if (!student.name.trim()) found.name = 'Name is required'
    if (!student.branch.trim()) found.branch = 'Branch is required'
    if (!student.division.trim()) found.division = 'Division is required'

    marks.forEach((row, index) => {
      const check = (field, max) => {
        const value = row[field]
        if (value === '') found[`${field}${index}`] = 'Required'
        else if (Number(value) < 0 || Number(value) > max) found[`${field}${index}`] = `0 to ${max}`
      }
      check('mse', syllabus.mseMax)
      check('ese', syllabus.eseMax)
    })

    setErrors(found)
    return Object.keys(found).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return

    const saved = await onSave({
      ...student,
      prn: student.prn.trim(),
      subjects: preview.subjects.map((row) => ({
        code: row.code,
        name: row.name,
        credits: row.credits,
        mse: row.mse,
        ese: row.ese,
      })),
    })

    if (saved) {
      setStudent(BLANK_STUDENT)
      setMarks(syllabus.subjects.map(() => ({ mse: '', ese: '' })))
      setErrors({})
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <h2>Enter semester marks</h2>
      <p className="hint">
        MSE carries 30% and ESE 70% of each 100 mark subject. Saving an existing PRN updates it.
      </p>

      <div className="grid">
        <Field label="PRN" error={errors.prn}>
          <input
            className={errors.prn ? 'invalid' : ''}
            value={student.prn}
            onChange={(e) => setStudent({ ...student, prn: e.target.value })}
            placeholder="20221001"
            inputMode="numeric"
          />
        </Field>
        <Field label="Student name" error={errors.name}>
          <input
            className={errors.name ? 'invalid' : ''}
            value={student.name}
            onChange={(e) => setStudent({ ...student, name: e.target.value })}
            placeholder="Aarav Deshmukh"
          />
        </Field>
        <Field label="Branch" error={errors.branch}>
          <input
            className={errors.branch ? 'invalid' : ''}
            value={student.branch}
            onChange={(e) => setStudent({ ...student, branch: e.target.value })}
          />
        </Field>
        <Field label="Division" error={errors.division}>
          <input
            className={errors.division ? 'invalid' : ''}
            value={student.division}
            onChange={(e) => setStudent({ ...student, division: e.target.value })}
          />
        </Field>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Cr.</th>
              <th>MSE / {syllabus.mseMax}</th>
              <th>ESE / {syllabus.eseMax}</th>
              <th>Total</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {preview.subjects.map((row, index) => (
              <tr key={row.code}>
                <td className="subject-cell" data-label="Subject">
                  <span className="subject-code">{row.code}</span>
                  {row.name}
                </td>
                <td data-label="Credits">{row.credits}</td>
                <MarkCell
                  label="MSE"
                  max={syllabus.mseMax}
                  value={marks[index].mse}
                  error={errors[`mse${index}`]}
                  subject={row.name}
                  onChange={(value) => setMark(index, 'mse', value)}
                />
                <MarkCell
                  label="ESE"
                  max={syllabus.eseMax}
                  value={marks[index].ese}
                  error={errors[`ese${index}`]}
                  subject={row.name}
                  onChange={(value) => setMark(index, 'ese', value)}
                />
                <td data-label="Total">{row.total ?? '—'}</td>
                <td data-label="Grade">
                  {row.grade ? (
                    <span className={`grade grade-${row.grade}`}>{row.grade}</span>
                  ) : (
                    <span className="grade grade-empty">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="preview">
        <span>
          Total <strong>{preview.totalMarks}</strong> / {syllabus.subjects.length * 100}
        </span>
        <span>
          SGPA <strong>{preview.complete ? preview.sgpa.toFixed(2) : '—'}</strong>
        </span>
        {preview.complete ? (
          <span className={preview.backlogs ? 'status fail' : 'status pass'}>
            {preview.backlogs ? `${preview.backlogs} backlog(s)` : 'All cleared'}
          </span>
        ) : (
          <span>Fill every subject to see the SGPA.</span>
        )}
      </div>

      <button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save result'}
      </button>
    </form>
  )
}

function MarkCell({ label, max, value, error, subject, onChange }) {
  return (
    <td data-label={label}>
      <span className="mark-input">
        <input
          className={error ? 'invalid' : ''}
          type="number"
          min="0"
          max={max}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${subject} ${label} marks`}
          aria-invalid={Boolean(error)}
        />
        {error && <em className="error">{error}</em>}
      </span>
    </td>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <em className="error">{error}</em>}
    </label>
  )
}
