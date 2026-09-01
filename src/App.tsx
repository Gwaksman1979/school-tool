import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { getSchoolId } from './lib/auth'
import BusPage from './pages/BusPage'
import ClassPage from './pages/ClassPage'
import LoginPage from './pages/LoginPage'
import SeedPage from './pages/SeedPage'
import SettingsPage from './pages/SettingsPage'
import StudentsPage from './pages/StudentsPage'

function LoginOrRedirect() {
  if (getSchoolId()) {
    return <Navigate to="/bus" replace />
  }
  return <LoginPage />
}

function RequireAuth() {
  if (!getSchoolId()) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginOrRedirect />} />
        <Route path="/seed" element={<SeedPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/bus" element={<BusPage />} />
            <Route path="/class" element={<ClassPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
