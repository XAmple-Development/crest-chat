import { Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Auth from './pages/Auth'
import ChatApp from './pages/ChatApp'
import LoadingSpinner from './components/LoadingSpinner'

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
          element={user ? <ChatApp /> : <Auth />} 
        />
        <Route 
          path="/auth" 
          element={user ? <ChatApp /> : <Auth />} 
        />
        <Route 
          path="*" 
          element={user ? <ChatApp /> : <Auth />} 
        />
      </Routes>
    </div>
  )
}

export default App
