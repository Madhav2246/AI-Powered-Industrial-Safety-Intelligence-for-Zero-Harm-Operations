import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Shield, Activity, ArrowRight, Zap, Map, MessageSquare,
  FlaskConical, ClipboardCheck, CheckCircle, BarChart2, ChevronRight, Lock
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-[#1f2937] bg-[#111827]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Shield size={18} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-white font-bold tracking-tight text-base">AEGIS OS</span>
              <span className="text-[10px] font-mono text-[#9ca3af] bg-[#1f2937] px-2 py-0.5 rounded">v1.0 ENTERPRISE</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-[#9ca3af] font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#modules" className="hover:text-white transition-colors">Platform Modules</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Launch Platform</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-6 max-w-7xl mx-auto border-b border-[#1f2937]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              AUTONOMOUS INDUSTRIAL SAFETY INTELLIGENCE
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Predict and Prevent Industrial Incidents Before They Occur.
            </h1>

            <p className="text-base text-[#9ca3af] leading-relaxed max-w-2xl">
              AegisOS unifies real-time IoT sensor streams, work permits, and spatial data into a multi-agent AI engine — detecting compound hazards, running digital twin simulations, and guiding workers toward <strong className="text-white">Zero-Harm Operations</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/dashboard"
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
              >
                <span>Open Command Center</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/simulation"
                className="bg-[#1f2937] hover:bg-[#374151] text-gray-200 border border-[#374151] px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all"
              >
                <FlaskConical size={16} className="text-purple-400" />
                <span>Test Digital Twin Lab</span>
              </Link>
            </div>

            {/* Quick Metrics Ticker */}
            <div className="pt-8 grid grid-cols-3 gap-6 border-t border-[#1f2937]">
              <div>
                <div className="text-2xl font-bold font-mono text-white">99.4%</div>
                <div className="text-xs text-[#9ca3af] mt-0.5">Hazard Detection Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-emerald-400">247</div>
                <div className="text-xs text-[#9ca3af] mt-0.5">Zero-LTI Days</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-blue-400">&lt; 50ms</div>
                <div className="text-xs text-[#9ca3af] mt-0.5">Telemetry Ingestion Latency</div>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="lg:col-span-5">
            <div className="panel-card p-5 space-y-4 border-blue-900/40">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-3">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-blue-500" />
                  <span className="font-mono text-xs font-semibold text-white">LIVE TELEMETRY STREAM</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded uppercase">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="bg-[#0b0f19] p-3 rounded border border-[#1f2937] flex items-center justify-between">
                  <span className="text-[#9ca3af]">Z3 Chemical Storage</span>
                  <span className="text-amber-400 font-bold">GAS: 240 ppm</span>
                </div>
                <div className="bg-[#0b0f19] p-3 rounded border border-[#1f2937] flex items-center justify-between">
                  <span className="text-[#9ca3af]">Z5 Confined Space A</span>
                  <span className="text-red-400 font-bold">RISK SCORE: 78/100</span>
                </div>
                <div className="bg-[#0b0f19] p-3 rounded border border-[#1f2937] flex items-center justify-between">
                  <span className="text-[#9ca3af]">PTW Conflict Audit</span>
                  <span className="text-emerald-400 font-bold">VERIFIED CLEAR</span>
                </div>
              </div>

              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded text-xs text-blue-200 flex items-start gap-2">
                <Shield size={16} className="text-blue-400 shrink-0 mt-0.5" />
                <span>Multi-agent RiskAgent is actively scoring 8 factory zones in background.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Modules Section */}
      <section id="modules" className="py-20 px-6 max-w-7xl mx-auto border-b border-[#1f2937]">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <h2 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">PLATFORM MODULES</h2>
          <p className="text-3xl font-extrabold text-white tracking-tight">Five Specialized Modules for Total Safety Control</p>
          <p className="text-sm text-[#9ca3af]">Click any module below to launch directly into the operational workspace.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Command Center',
              to: '/dashboard',
              icon: BarChart2,
              color: 'text-blue-400',
              desc: 'Executive real-time telemetry dashboard, 8-zone risk matrix, SHAP factor attribution, and active alert feeds.',
            },
            {
              title: 'Spatial GIS Map',
              to: '/map',
              icon: Map,
              color: 'text-emerald-400',
              desc: 'Interactive factory floor GIS visualization with real-time zone risk heatmaps and worker tracking.',
            },
            {
              title: 'Digital Twin Lab',
              to: '/simulation',
              icon: FlaskConical,
              color: 'text-purple-400',
              desc: 'Physics-based cascade propagation engine for what-if scenario testing and property damage estimation.',
            },
            {
              title: 'Safety Copilot',
              to: '/copilot',
              icon: MessageSquare,
              color: 'text-amber-400',
              desc: 'Conversational RAG assistant answering worker safety queries, PPE matrix checks, and evacuation protocols.',
            },
            {
              title: 'Compliance & PTW',
              to: '/compliance',
              icon: ClipboardCheck,
              color: 'text-indigo-400',
              desc: 'OSHA & Factories Act compliance tracker, Permit-to-Work conflict detector, and PDF report generator.',
            },
            {
              title: 'Multi-Agent Engine',
              to: '/dashboard',
              icon: Zap,
              color: 'text-red-400',
              desc: 'Autonomous orchestrator coordinating RiskAgent, SimAgent, CopilotAgent, ActionAgent, and ExplainerAgent.',
            },
          ].map((mod) => (
            <div
              key={mod.title}
              onClick={() => navigate(mod.to)}
              className="panel-card p-6 cursor-pointer hover:border-[#374151] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <mod.icon size={22} className={mod.color} />
                  <ChevronRight size={16} className="text-[#6b7280] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mb-2">{mod.title}</h3>
                <p className="text-xs text-[#9ca3af] leading-relaxed">{mod.desc}</p>
              </div>
              <div className="mt-6 pt-3 border-t border-[#1f2937] text-[11px] font-mono text-[#6b7280] group-hover:text-white transition-colors flex items-center justify-between">
                <span>OPEN MODULE</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Footer */}
      <section className="py-20 px-6 max-w-7xl mx-auto text-center">
        <div className="panel-card p-12 bg-gradient-to-b from-[#111827] to-[#0b0f19] border-blue-900/30 space-y-6 max-w-4xl mx-auto">
          <Shield size={36} className="text-blue-500 mx-auto" />
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Ready to Deploy AegisOS?</h2>
          <p className="text-sm text-[#9ca3af] max-w-xl mx-auto">
            Experience zero-harm industrial intelligence in real time. Launch the operational platform or test digital twin scenarios.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/dashboard"
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
            >
              <span>Launch AegisOS Platform</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1f2937] py-8 text-center text-xs font-mono text-[#6b7280]">
        AegisOS Industrial Safety Intelligence Platform • Zero-Harm Operations 2026
      </footer>
    </div>
  )
}
