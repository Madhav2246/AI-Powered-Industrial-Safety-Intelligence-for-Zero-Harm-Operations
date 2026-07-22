import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import {
  Shield, LayoutDashboard, Map, MessageSquare,
  FlaskConical, ClipboardCheck, Home
} from 'lucide-react'

import useAegisStore from './store/aegisStore'
import LandingPage from './pages/LandingPage'
import CommandCenter from './pages/CommandCenter'
import MapView from './pages/MapView'
import WorkerCopilot from './pages/WorkerCopilot'
import SimulationLab from './pages/SimulationLab'
import Compliance from './pages/Compliance'

const NAV_ITEMS = [
  { to: '/',            icon: Home,            label: 'Home / Overview' },
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Command Center'  },
  { to: '/map',         icon: Map,             label: 'Spatial Map'     },
  { to: '/copilot',     icon: MessageSquare,   label: 'Safety Copilot'  },
  { to: '/simulation',  icon: FlaskConical,    label: 'Digital Twin'    },
  { to: '/compliance',  icon: ClipboardCheck,  label: 'Compliance & PTW'},
]

function Sidebar() {
  const { kpis, alertCount, wsConnected } = useAegisStore()

  return (
    <aside className="w-[230px] flex-shrink-0 flex flex-col bg-[#111827] border-r border-[#1f2937] h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <NavLink to="/" className="px-5 py-4 border-b border-[#1f2937] flex items-center gap-2.5 hover:bg-[#1f2937]/40 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          <Shield size={18} />
        </div>
        <div>
          <div className="text-white font-semibold text-sm tracking-tight leading-none">AEGIS OS</div>
          <div className="text-[#6b7280] text-[11px] font-mono mt-1">INDUSTRIAL SAFETY</div>
        </div>
      </NavLink>

      {/* Connection Status */}
      <div className="px-5 py-2.5 bg-[#0b0f19] border-b border-[#1f2937] flex items-center justify-between text-xs font-mono">
        <span className="text-[#9ca3af]">SYSTEM</span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="text-white font-medium text-[11px]">
            {wsConnected ? 'ONLINE' : 'STANDALONE'}
          </span>
        </div>
      </div>

      {/* Telemetry Summary */}
      <div className="px-4 py-3 border-b border-[#1f2937] grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#0b0f19] p-2 rounded border border-[#1f2937] text-center">
          <div className="text-[#9ca3af] text-[10px] uppercase font-medium">Sensors</div>
          <div className="text-white font-bold font-mono text-sm mt-0.5">{kpis.total_sensors || 20}</div>
        </div>
        <div className="bg-[#0b0f19] p-2 rounded border border-[#1f2937] text-center">
          <div className="text-[#9ca3af] text-[10px] uppercase font-medium">Anomalies</div>
          <div className={`font-bold font-mono text-sm mt-0.5 ${kpis.active_anomalies > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {kpis.active_anomalies || 0}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        <div className="px-3 pb-1 text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Navigation</div>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border-l-2 border-blue-500 font-semibold'
                  : 'text-[#9ca3af] hover:text-white hover:bg-[#1f2937]/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-2.5">
                  <Icon size={15} className={isActive ? 'text-blue-400' : 'text-[#6b7280]'} />
                  <span>{label}</span>
                </div>
                {label === 'Command Center' && alertCount > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                    {alertCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#1f2937] bg-[#0b0f19] text-[11px] text-[#6b7280] flex items-center justify-between font-mono">
        <span>MODE: LOCAL</span>
        <span>PORT: 8000</span>
      </div>
    </aside>
  )
}

function MainLayout() {
  const location = useLocation()
  const isLandingPage = location.pathname === '/'
  const { fetchKpis, fetchAlerts, startMockStream, connectWebSocket } = useAegisStore()

  useEffect(() => {
    fetchKpis()
    fetchAlerts()
    startMockStream()
    connectWebSocket()

    const kpiTimer = setInterval(fetchKpis, 5000)
    const alertTimer = setInterval(fetchAlerts, 10000)

    return () => {
      clearInterval(kpiTimer)
      clearInterval(alertTimer)
    }
  }, [])

  if (isLandingPage) {
    return <LandingPage />
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-gray-100 antialiased">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/dashboard"  element={<CommandCenter />} />
          <Route path="/map"        element={<MapView />} />
          <Route path="/copilot"    element={<WorkerCopilot />} />
          <Route path="/simulation" element={<SimulationLab />} />
          <Route path="/compliance" element={<Compliance />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#111827', color: '#f9fafb', border: '1px solid #1f2937', fontSize: '13px' },
          duration: 3500,
        }}
      />
      <Routes>
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  )
}
