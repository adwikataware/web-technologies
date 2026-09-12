import { Navigate, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CataloguePage from './pages/CataloguePage'
import { useAuth } from './auth/AuthContext'

/** Sends an already signed-in visitor away from the login and register pages. */
function GuestOnly({ children }: { children: React.ReactElement }) {
  const { account, loading } = useAuth()
  if (loading) return <p className="page-loading">Checking your session…</p>
  return account ? <Navigate to="/catalogue" replace /> : children
}

export default function App() {
  return (
    <div className="app">
      <NavBar />

      <main className="page">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogue" element={<CataloguePage />} />
          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>Pages &amp; Prints · Assignment 7 · React + TypeScript, Spring Boot, MongoDB</p>
      </footer>
    </div>
  )
}
