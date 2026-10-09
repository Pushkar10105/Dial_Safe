import React, { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import FindPage from './pages/FindPage.jsx'
import NumberDetailPage from './pages/NumberDetailPage.jsx'
import BrandDetailPage from './pages/BrandDetailPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ReportPage from './pages/ReportPage.jsx'
import VoiceAssistantModal from './components/VoiceAssistantModal.jsx'

export default function App() {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const navigate = useNavigate()

  const handleVoiceCheckNumber = (number) => {
    setIsVoiceModalOpen(false)
    if (number) {
      navigate(`/number/${encodeURIComponent(number)}`)
    }
  }

  const openVoice = () => setIsVoiceModalOpen(true)

  return (
    <>
      <Routes>
        <Route path="/" element={<Home onOpenVoice={openVoice} />} />
        <Route path="/find" element={<FindPage onOpenVoice={openVoice} />} />
        <Route path="/number/:n" element={<NumberDetailPage onOpenVoice={openVoice} />} />
        <Route path="/brand/:name" element={<BrandDetailPage onOpenVoice={openVoice} />} />
        <Route path="/dashboard" element={<DashboardPage onOpenVoice={openVoice} />} />
        <Route path="/report" element={<ReportPage onOpenVoice={openVoice} />} />
      </Routes>

      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onCheckNumber={handleVoiceCheckNumber}
      />
    </>
  )
}
