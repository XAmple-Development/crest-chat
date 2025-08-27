import { Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Auth from './pages/Auth'
import LoadingSpinner from './components/LoadingSpinner'
import Messenger from './pages/Messenger'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-discord-bg">
      <Routes>
        <Route
          path="/"
          element={user ? <Messenger /> : <Auth />}
        />
        <Route
          path="/auth"
          element={user ? <Messenger /> : <Auth />}
        />
        <Route
          path="*"
          element={user ? <Messenger /> : <Auth />}
        />
      </Routes>
    </div>
  )
}

export default App
