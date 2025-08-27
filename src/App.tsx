import { Routes, Route } from 'react-router-dom'
import { WelcomeScreen } from '@/pages/WelcomeScreen'
import { Auth } from '@/pages/Auth'
import { ChatApp } from '@/pages/ChatApp'
import { InvitePage } from '@/pages/InvitePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/app" element={<ChatApp />} />
      <Route path="/invite/:inviteCode" element={<InvitePage />} />
    </Routes>
  )
}

export default App
