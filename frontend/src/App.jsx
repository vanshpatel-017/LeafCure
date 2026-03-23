import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import History from './pages/History'
import Results from './pages/Results'
import ResearcherResults from './pages/ResearcherResults'
import DemoResults from './pages/DemoResults'
import { ThemeProvider } from './hooks/useTheme'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="theme-page min-h-screen">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/results" element={<Results />} />
            <Route path="/results/detailed" element={<ResearcherResults />} />
            <Route path="/demo_results" element={<DemoResults />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
