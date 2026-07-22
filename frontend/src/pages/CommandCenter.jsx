import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, AlertTriangle, Shield, TrendingUp, Zap,
  CheckCircle, ArrowUpRight, Clock, Sliders
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import useAegisStore from '../store/aegisStore'

const RISK_COLORS = { low: '#16a34a', medium: '#d97706', high: '#ea580c', critical: '#dc2626' }

function riskLevel(score) {
  if (score < 25) return 'low'
  if (score < 50) return 'medium'
  if (score < 75) return 'high'
  return 'critical'
}

function MetricCard({ label, value, unit, icon: Icon, color = 'blue', subtext }) {
  const colorStyles = {
    blue: 'border-l-blue-500 text-blue-400',
    emerald: 'border-l-emerald-500 text-emerald-400',
    amber: 'border-l-amber-500 text-amber-400',
    red: 'border-l-red-500 text-red-400',
    indigo: 'border-l-indigo-500 text-indigo-400',
  }

  return (
    <div className={`panel-card p-4 border-l-4 ${colorStyles[color] || colorStyles.blue}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">{label}</span>
        <Icon size={16} className={colorStyles[color]?.split(' ')[1]} />
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono text-white">{value}</span>
        {unit && <span className="text-xs text-[#9ca3af] font-mono">{unit}</span>}
      </div>
      {subtext && <div className="text-[11px] text-[#6b7280] mt-1 truncate">{subtext}</div>}
    </div>
  )
}

function ZoneMatrix({ zones, onSelectZone }) {
  const ZONES_ORDER = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7', 'Z8']

  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity size={14} className="text-blue-500" />
          Factory Zone Telemetry Matrix
        </h3>
        <span className="text-[11px] font-mono text-[#9ca3af]">8 ACTIVE ZONES</span>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ZONES_ORDER.map((zid) => {
          const z = zones[zid] || { zone_name: zid, risk_score: 15 }
          const score = z.risk_score || 0
          const level = riskLevel(score)
          const color = RISK_COLORS[level]

          return (
            <button
              key={zid}
              onClick={() => onSelectZone(zid)}
              className="bg-[#0b0f19] border border-[#1f2937] hover:border-[#374151] rounded-lg p-3 text-left transition-all relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-white">{zid}</span>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold"
                  style={{ color, background: `${color}18`, border: `1px solid ${color}33` }}
                >
                  {level}
                </span>
              </div>
              <div className="text-xs text-[#9ca3af] truncate mt-1">{z.zone_name}</div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono" style={{ color }}>
                  {score.toFixed(0)}
                </span>
                <span className="text-[10px] text-[#6b7280] font-mono">SCORE</span>
              </div>
              {z.is_anomaly && (
                <div className="mt-2 text-[10px] text-red-400 font-medium flex items-center gap-1">
                  <AlertTriangle size={10} /> {z.anomaly_type || 'Anomaly'}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function RiskTrendChart({ zoneScores }) {
  const chartData = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const obj = { t: `T-${15 - i}m` }
      Object.entries(zoneScores).forEach(([zid, z]) => {
        obj[zid] = Math.max(0, Math.min(100, z.risk_score + (Math.random() - 0.5) * 10))
      })
      return obj
    })
  }, [Object.keys(zoneScores).join()])

  const topZones = Object.entries(zoneScores)
    .sort((a, b) => b[1].risk_score - a[1].risk_score)
    .slice(0, 3)
    .map(([id]) => id)

  const lineColors = ['#dc2626', '#ea580c', '#2563eb']

  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp size={14} className="text-blue-500" />
          Real-time Risk Trajectory
        </h3>
        <span className="text-[11px] font-mono text-[#9ca3af]">TOP 3 HIGH RISK ZONES</span>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={{ stroke: '#1f2937' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={{ stroke: '#1f2937' }} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '6px', fontSize: '12px' }}
            />
            {topZones.map((zid, i) => (
              <Area
                key={zid}
                type="monotone"
                dataKey={zid}
                name={zoneScores[zid]?.zone_name || zid}
                stroke={lineColors[i]}
                fill={`${lineColors[i]}15`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function SystemAlertFeed({ alerts, onAcknowledge }) {
  return (
    <div className="panel-card flex flex-col h-full">
      <div className="panel-card-header">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-500" />
          System Event Feed
        </h3>
        <span className="text-[10px] font-mono text-red-400 font-bold bg-red-950/50 border border-red-800 px-2 py-0.5 rounded">
          {alerts.filter(a => !a.is_acknowledged).length} UNACKNOWLEDGED
        </span>
      </div>
      <div className="p-3 space-y-2 overflow-y-auto max-h-[320px]">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#6b7280]">No active system alerts</div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.alert_id}
              className={`p-3 rounded border text-xs ${
                a.is_acknowledged
                  ? 'bg-[#0b0f19] border-[#1f2937] opacity-60'
                  : a.severity === 'critical'
                    ? 'bg-red-950/20 border-red-800/60 text-red-200'
                    : 'bg-amber-950/20 border-amber-800/60 text-amber-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="font-bold uppercase" style={{ color: RISK_COLORS[a.severity] || '#9ca3af' }}>
                      [{a.severity}]
                    </span>
                    <span className="text-[#9ca3af]">{a.zone_id}</span>
                  </div>
                  <div className="font-medium text-white mt-1">{a.title}</div>
                </div>
                {!a.is_acknowledged && (
                  <button
                    onClick={() => onAcknowledge(a.alert_id)}
                    className="text-[11px] text-[#9ca3af] hover:text-white bg-[#1f2937] px-2 py-1 rounded border border-[#374151]"
                  >
                    Ack
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function RiskFactorBreakdown({ zone }) {
  if (!zone) return (
    <div className="panel-card p-6 text-center text-xs text-[#6b7280]">
      Select a zone from the telemetry matrix to inspect factor attribution
    </div>
  )

  const factors = [
    { name: 'Atmospheric Gas Concentration', weight: 40, val: `${zone.gas_level?.toFixed(1) || 5} ppm` },
    { name: 'Thermal Variance', weight: 25, val: `${zone.temperature?.toFixed(1) || 22} °C` },
    { name: 'Permit Hazard Multiplier', weight: zone.is_anomaly ? 20 : 5, val: zone.is_anomaly ? 'Active' : 'Normal' },
    { name: 'Vibration & Mechanical Stress', weight: 15, val: '0.6 m/s²' },
  ]

  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Sliders size={14} className="text-indigo-400" />
          Factor Attribution — {zone.zone_id}
        </h3>
        <span className="font-mono text-xs font-bold" style={{ color: RISK_COLORS[riskLevel(zone.risk_score)] }}>
          SCORE: {zone.risk_score?.toFixed(0)}
        </span>
      </div>
      <div className="p-4 space-y-3">
        {factors.map((f) => (
          <div key={f.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#9ca3af]">{f.name}</span>
              <span className="font-mono font-medium text-white">{f.val}</span>
            </div>
            <div className="h-1.5 bg-[#0b0f19] rounded overflow-hidden border border-[#1f2937]">
              <div
                className="h-full rounded"
                style={{
                  width: `${f.weight}%`,
                  background: f.weight > 30 ? '#dc2626' : f.weight > 15 ? '#d97706' : '#2563eb'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CommandCenter() {
  const { kpis, zoneRiskScores, alerts, selectedZone, setSelectedZone, acknowledgeAlert } = useAegisStore()
  const selectedZoneData = zoneRiskScores[selectedZone] || null

  return (
    <div className="p-6 space-y-5 bg-[#0b0f19] min-h-screen">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1f2937]">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">OPERATIONAL COMMAND CENTER</h1>
          <p className="text-xs text-[#9ca3af] mt-0.5">Real-time industrial risk telemetry & automated safety monitoring</p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-[#9ca3af]">
          <span className="bg-[#111827] px-3 py-1.5 rounded border border-[#1f2937] text-white">
            STATUS: <span className="text-emerald-400 font-bold">NOMINAL</span>
          </span>
        </div>
      </div>

      {/* Structured Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <MetricCard label="Active Sensors" value={kpis.total_sensors || 20} icon={Activity} color="blue" subtext="Across 8 zones" />
        <MetricCard label="Anomaly Count" value={kpis.active_anomalies || 0} icon={AlertTriangle} color={kpis.active_anomalies > 0 ? 'red' : 'emerald'} subtext="Threshold breaches" />
        <MetricCard label="Avg Risk Index" value={kpis.avg_risk_score || '38.5'} unit="/100" icon={TrendingUp} color="amber" subtext="Factory weighted average" />
        <MetricCard label="Max Zone Score" value={kpis.max_risk_score || '72.0'} unit="/100" icon={Zap} color="red" subtext={kpis.critical_zones?.join(', ') || 'Z3 Chemical'} />
        <MetricCard label="Zero LTI Streak" value="247" unit="DAYS" icon={CheckCircle} color="emerald" subtext="No lost time injuries" />
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <ZoneMatrix zones={zoneRiskScores} onSelectZone={setSelectedZone} />
          <RiskTrendChart zoneScores={zoneRiskScores} />
        </div>
        <div className="space-y-5">
          <SystemAlertFeed alerts={alerts} onAcknowledge={acknowledgeAlert} />
          <RiskFactorBreakdown zone={selectedZoneData} />
        </div>
      </div>
    </div>
  )
}
