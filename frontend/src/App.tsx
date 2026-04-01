import { Navigate, Route, Routes } from 'react-router-dom'

import RequireAuth from './components/RequireAuth'
import FavouritePage from './pages/favourite'
import LoginPage from './pages/login'
import NewPropertyPage from './pages/new_property'
import PropertyPage from './pages/property'
import RegisterPage from './pages/register'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/properties"
        element={
          <RequireAuth>
            <PropertyPage />
          </RequireAuth>
        }
      />
      <Route
        path="/favourite"
        element={
          <RequireAuth>
            <FavouritePage />
          </RequireAuth>
        }
      />
      <Route
        path="/new_property"
        element={
          <RequireAuth>
            <NewPropertyPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
