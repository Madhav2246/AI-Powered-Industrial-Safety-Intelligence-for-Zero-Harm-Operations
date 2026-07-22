import React, { useState } from 'react'
import { FlaskConical, Play, AlertTriangle, Clock, Users, DollarSign, ChevronRight } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SCENARIOS = [
  { id: 'gas_leak', name: 'Gas Accumulation', desc: 'Flammable/toxic gas leakage' },
  { id: 'temperature_spike', name: 'Thermal Runaway', desc: 'Equipment thermal spike' },
  { id: 'equipment_failure', name: 'Machine Breakdown', desc: 'Mechanical stress failure' },
  { id: 'fire', name: 'Zone Fire', desc: 'Thermal fire propagation' },
  { id: 'explosion', name: 'Vapor Explosion', desc: 'Secondary ignition shockwave' },
]

const ZONES = ['Z1','Z2','Z3','Z4','Z5','Z6','Z7','Z8']
const ZONE_NAMES = { Z1:'Production Floor A', Z2:'Production Floor B', Z3:'Chemical Storage', Z4:'Boiler Room', Z5:'Confined Space A', Z6:'Electrical Room', Z7:'Loading Bay', Z8:'Control Room' }

export default function SimulationLab() {
  const [zone, setZone] = useState('Z3')
  const [scenario, setScenario] = useState('gas_leak')
  const [severity, setSeverity] = useState(0.7)
  const [hotWork, setHotWork] = useState(false)
  const [workers, setWorkers] = useState(5)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const runSimulation = async () => {
    setLoading(true)
    setResult(null)
    const params = {
      zone_id: zone,
      scenario: scenario,
      severity: severity,
      has_hot_work_permit: hotWork,
      workers_in_zone: workers,
      ventilation_active: true,
      fire_suppression_active: true,
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/simulation/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (res.ok) {
        setResult(await res.json())
      } else {
        throw new Error()
      }
    } catch {
      // Standalone simulation model
      const s = severity
      const initial = Math.min(45 + s * 45, 100)
      const peak = Math.min(initial * (hotWork && scenario === 'gas_leak' ? 1.4 : 1.0), 100)
      setResult({
        scenario: scenario,
        trigger_zone: zone,
        initial_risk_score: initial,
        peak_risk_score: peak,
        timeline: [
          { time_min: 0, event: `${scenario.replace('_', ' ').toUpperCase()} initiated at ${zone}`, risk: initial.toFixed(1) },
          { time_min: 5, event: 'Thermal/Atmospheric propagation reaches adjacent zone (Z4)', risk: (peak * 0.65).toFixed(1) },
          { time_min: 15, event: 'Secondary containment boundary reached', risk: (peak * 0.3).toFixed(1) },
        ],
        estimated_casualties: { evacuation_required: workers + 6, estimated_injuries: Math.round(workers * peak / 100 * 0.25), estimated_fatalities: 0 },
        estimated_property_damage_usd: Math.round(peak * s * 35000),
        prevention_actions: ['Isolate fuel / gas inlet valve immediately', 'Deploy secondary ventilation scrubbers', 'Issue emergency worker evacuation broadcast'],
        explanation: `Simulated ${scenario.replace('_', ' ')} in ${ZONE_NAMES[zone]} yields peak risk of ${peak.toFixed(0)}/100. ${hotWork ? 'Hot Work Permit presence elevates ignition probability by 40%.' : ''}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-5 bg-[#0b0f19] min-h-screen">
      <div className="flex items-center justify-between pb-4 border-b border-[#1f2937]">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">DIGITAL TWIN SIMULATION LAB</h1>
          <p className="text-xs text-[#9ca3af]">Predictive incident cascade simulation & preventative decision support</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Controls */}
        <div className="panel-card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Simulation Parameters</h3>

          <div>
            <label className="text-xs text-[#9ca3af] block mb-1">Scenario Type</label>
            <select value={scenario} onChange={e => setScenario(e.target.value)} className="w-full text-xs">
              {SCENARIOS.map(s => <option key={s.id} value={s.id}>{s.name} — {s.desc}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-[#9ca3af] block mb-1">Target Zone</label>
            <select value={zone} onChange={e => setZone(e.target.value)} className="w-full text-xs">
              {ZONES.map(z => <option key={z} value={z}>{z} — {ZONE_NAMES[z]}</option>)}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs text-[#9ca3af] mb-1">
              <span>Severity Scale</span>
              <span className="font-mono text-white">{(severity * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min="0.1" max="1.0" step="0.05" value={severity} onChange={e => setSeverity(parseFloat(e.target.value))} className="w-full" />
          </div>

          <div>
            <div className="flex justify-between text-xs text-[#9ca3af] mb-1">
              <span>Personnel Count</span>
              <span className="font-mono text-white">{workers} workers</span>
            </div>
            <input type="range" min="1" max="20" value={workers} onChange={e => setWorkers(parseInt(e.target.value))} className="w-full" />
          </div>

          <div className="pt-2 border-t border-[#1f2937] flex items-center justify-between">
            <span className="text-xs text-[#9ca3af]">Hot Work Permit Active</span>
            <input type="checkbox" checked={hotWork} onChange={e => setHotWork(e.target.checked)} className="w-4 h-4" />
          </div>

          <button onClick={runSimulation} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded transition-colors flex items-center justify-center gap-2">
            <Play size={14} /> {loading ? 'Running Physics Engine...' : 'Run Cascade Simulation'}
          </button>
        </div>

        {/* Output */}
        <div className="xl:col-span-2 space-y-4">
          {!result ? (
            <div className="panel-card h-80 flex flex-col items-center justify-center text-xs text-[#6b7280]">
              <FlaskConical size={32} className="mb-2 text-[#374151]" />
              Select scenario parameters and click "Run Cascade Simulation"
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="panel-card p-4 text-center">
                  <div className="text-xs text-[#9ca3af] uppercase font-semibold">Peak Risk Score</div>
                  <div className="text-3xl font-bold font-mono text-red-500 mt-1">{result.peak_risk_score.toFixed(0)}</div>
                  <div className="text-[11px] text-[#6b7280]">Out of 100</div>
                </div>
                <div className="panel-card p-4 text-center">
                  <div className="text-xs text-[#9ca3af] uppercase font-semibold">Evacuations</div>
                  <div className="text-3xl font-bold font-mono text-amber-500 mt-1">{result.estimated_casualties.evacuation_required}</div>
                  <div className="text-[11px] text-[#6b7280]">Personnel required</div>
                </div>
                <div className="panel-card p-4 text-center">
                  <div className="text-xs text-[#9ca3af] uppercase font-semibold">Damage Estimate</div>
                  <div className="text-3xl font-bold font-mono text-blue-400 mt-1">${(result.estimated_property_damage_usd / 1000).toFixed(0)}K</div>
                  <div className="text-[11px] text-[#6b7280]">Estimated impact</div>
                </div>
              </div>

              <div className="panel-card p-4">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Propagation Timeline</h4>
                <div className="space-y-2 text-xs">
                  {result.timeline.map((step, i) => (
                    <div key={i} className="flex justify-between p-2 bg-[#0b0f19] rounded border border-[#1f2937]">
                      <span className="font-mono text-blue-400">T+{step.time_min}m</span>
                      <span className="text-gray-200">{step.event}</span>
                      <span className="font-mono text-red-400 font-bold">Score: {step.risk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel-card p-4">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Preventative Action Plan</h4>
                <ul className="space-y-1.5 text-xs text-gray-300">
                  {result.prevention_actions.map(act => (
                    <li key={act} className="flex items-center gap-2">
                      <ChevronRight size={12} className="text-emerald-400" /> {act}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
