import { useCallback, useEffect, useState } from 'react'
import { deleteResult, getResults, getSyllabus, saveResult } from './api.js'
import MarksForm from './components/MarksForm.jsx'
import ResultList from './components/ResultList.jsx'
import Marksheet from './components/Marksheet.jsx'

export default function App() {
  const [syllabus, setSyllabus] = useState(null)
  const [results, setResults] = useState([])
  const [openPrn, setOpenPrn] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [fatal, setFatal] = useState(null)

  const refresh = useCallback(async () => {
    setResults(await getResults())
  }, [])

  useEffect(() => {
    Promise.all([getSyllabus(), getResults()])
      .then(([loadedSyllabus, loadedResults]) => {
        setSyllabus(loadedSyllabus)
        setResults(loadedResults)
      })
      .catch((error) => setFatal(error.message))
  }, [])

  async function handleSave(payload) {
    setSaving(true)
    try {
      const saved = await saveResult(payload)
      await refresh()
      setNotice({ tone: 'ok', text: `Result prepared for ${saved.name} (SGPA ${saved.sgpa.toFixed(2)}).` })
      return saved
    } catch (error) {
      setNotice({ tone: 'bad', text: error.message })
      return null
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(prn) {
    try {
      await deleteResult(prn)
      setOpenPrn(null)
      await refresh()
      setNotice({ tone: 'ok', text: `Removed result for PRN ${prn}.` })
    } catch (error) {
      setNotice({ tone: 'bad', text: error.message })
    }
  }

  const open = results.find((result) => result.prn === openPrn) ?? null

  return (
    <div className="page">
      <header className="masthead">
        <h1>VIT Semester Result</h1>
        <p>Third Year · Semester V · MSE 30% + ESE 70%</p>
      </header>

      {fatal && (
        <p className="banner bad">
          {fatal} — is the Spring Boot API running on port 8080?
        </p>
      )}

      {notice && (
        <p className={`banner ${notice.tone === 'ok' ? 'good' : 'bad'}`} onClick={() => setNotice(null)}>
          {notice.text}
        </p>
      )}

      {syllabus && !fatal && (
        <main className="layout">
          {open ? (
            <Marksheet result={open} onClose={() => setOpenPrn(null)} onDelete={handleDelete} />
          ) : (
            <MarksForm syllabus={syllabus} onSave={handleSave} saving={saving} />
          )}
          <ResultList results={results} onOpen={(result) => setOpenPrn(result.prn)} />
        </main>
      )}

      <footer className="foot">React · Spring Boot · MongoDB</footer>
    </div>
  )
}
