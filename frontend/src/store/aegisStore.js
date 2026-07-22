// AegisOS — Zustand Global Store
// Manages: sensor readings, alerts, zone risk scores, websocket connection
import { create } from 'zustand'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_BASE  = import.meta.env.VITE_WS_URL  || 'ws://localhost:8000'

const useAegisStore = create((set, get) => ({
  // Connection state
  wsConnected: false,
  apiReachable: false,

  // Live sensor data
  sensorReadings: {},       // { sensor_id: reading }
  zoneRiskScores: {},       // { zone_id: { risk_score, risk_level, ... } }
  kpis: {
    total_sensors: 0,
    active_anomalies: 0,
    avg_risk_score: 0,
    max_risk_score: 0,
    critical_zones: [],
    system_status: 'LOADING',
  },

  // Alerts
  alerts: [],
  alertCount: 0,

  // Selected zone (for drill-down)
  selectedZone: null,

  // WebSocket
  wsInstance: null,

  // Actions
  setSelectedZone: (zoneId) => set({ selectedZone: zoneId }),

  updateSensorReading: (reading) =>
    set((state) => ({
      sensorReadings: { ...state.sensorReadings, [reading.sensor_id]: reading },
      zoneRiskScores: {
        ...state.zoneRiskScores,
        [reading.zone_id]: {
          zone_id: reading.zone_id,
          zone_name: reading.zone_name,
          risk_score: reading.risk_score,
          risk_level: riskLevel(reading.risk_score),
          is_anomaly: reading.is_anomaly,
          anomaly_type: reading.anomaly_type,
          temperature: reading.temperature,
          gas_level: reading.gas_level,
        },
      },
    })),

  fetchKpis: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sensors/kpis`)
      if (res.ok) {
        const data = await res.json()
        set({ kpis: data, apiReachable: true })
      }
    } catch {
      // Use mock data if API not reachable
      set({ apiReachable: false, kpis: getMockKpis() })
    }
  },

  fetchAlerts: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/mock-feed`)
      if (res.ok) {
        const data = await res.json()
        set({ alerts: data.alerts, alertCount: data.alerts.filter(a => !a.is_acknowledged).length })
      }
    } catch {
      set({ alerts: getMockAlerts() })
    }
  },

  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map(a =>
        a.alert_id === alertId ? { ...a, is_acknowledged: true } : a
      ),
      alertCount: Math.max(0, state.alertCount - 1),
    })),

  connectWebSocket: () => {
    const existing = get().wsInstance
    if (existing) return

    const ws = new WebSocket(`${WS_BASE}/api/sensors/ws/live`)

    ws.onopen = () => {
      set({ wsConnected: true, wsInstance: ws })
      console.log('✅ AegisOS WebSocket connected')
    }

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data)
        if (msg.type === 'sensor_update') {
          get().updateSensorReading(msg.payload)
        }
      } catch {}
    }

    ws.onerror = () => {
      // Fall back to polling if WS unavailable (common in demo mode)
      set({ wsConnected: false })
    }

    ws.onclose = () => {
      set({ wsConnected: false, wsInstance: null })
      // Reconnect after 3s
      setTimeout(() => get().connectWebSocket(), 3000)
    }

    set({ wsInstance: ws })
  },

  disconnectWebSocket: () => {
    const ws = get().wsInstance
    if (ws) {
      ws.close()
      set({ wsInstance: null, wsConnected: false })
    }
  },

  // Mock sensor simulation (used when API not reachable)
  startMockStream: () => {
    const ZONES = {
      Z1: 'Production Floor A', Z2: 'Production Floor B',
      Z3: 'Chemical Storage',   Z4: 'Boiler Room',
      Z5: 'Confined Space A',   Z6: 'Electrical Room',
      Z7: 'Loading Bay',        Z8: 'Control Room',
    }
    const BASE_RISKS = { Z1:30, Z2:30, Z3:65, Z4:55, Z5:75, Z6:45, Z7:20, Z8:15 }

    let t = 0
    setInterval(() => {
      t += 1
      Object.entries(ZONES).forEach(([zoneId, zoneName]) => {
        const base = BASE_RISKS[zoneId]
        const noise = (Math.sin(t / 10 + zoneId.charCodeAt(1)) * 10) + (Math.random() - 0.5) * 5
        const risk = Math.max(0, Math.min(100, base + noise))

        // Occasionally spike Chemical Storage
        const gasAnomaly = zoneId === 'Z3' && Math.random() < 0.02

        const reading = {
          sensor_id: `${zoneId}-S1`,
          zone_id: zoneId,
          zone_name: zoneName,
          risk_score: gasAnomaly ? Math.min(100, risk + 35) : risk,
          temperature: 22 + base * 0.3 + Math.sin(t / 20) * 5,
          gas_level: gasAnomaly ? 450 + Math.random() * 300 : 5 + Math.random() * 10,
          pressure: 1.0 + Math.sin(t / 30) * 0.05,
          vibration: 0.5 + Math.random() * 0.3,
          is_anomaly: gasAnomaly,
          anomaly_type: gasAnomaly ? 'gas_leak' : null,
          timestamp: new Date().toISOString(),
        }
        get().updateSensorReading(reading)
      })

      // Update KPIs
      const scores = Object.values(get().zoneRiskScores)
      if (scores.length > 0) {
        const avg = scores.reduce((s, z) => s + z.risk_score, 0) / scores.length
        const max = Math.max(...scores.map(z => z.risk_score))
        const critical = scores.filter(z => z.risk_score > 75).map(z => z.zone_id)
        set({
          kpis: {
            total_sensors: scores.length * 2,
            active_anomalies: scores.filter(z => z.is_anomaly).length,
            avg_risk_score: avg.toFixed(1),
            max_risk_score: max.toFixed(1),
            critical_zones: critical,
            system_status: max > 80 ? 'CRITICAL' : max > 50 ? 'WARNING' : 'NOMINAL',
          }
        })
      }
    }, 1500)
  },
}))

// Helpers
function riskLevel(score) {
  if (score < 25) return 'low'
  if (score < 50) return 'medium'
  if (score < 75) return 'high'
  return 'critical'
}

function getMockKpis() {
  return {
    total_sensors: 20, active_anomalies: 2, avg_risk_score: 38.5,
    max_risk_score: 72.0, critical_zones: ['Z3', 'Z5'], system_status: 'WARNING',
  }
}

function getMockAlerts() {
  return [
    { alert_id: '1', severity: 'critical', category: 'gas_leak', zone_id: 'Z3', title: 'Gas level exceeds 200ppm in Chemical Storage', risk_score: 87, is_acknowledged: false, timestamp: new Date().toISOString(), agent: 'RiskAgent' },
    { alert_id: '2', severity: 'high', category: 'compound_risk', zone_id: 'Z5', title: 'COMPOUND: High temp + confined space + 4 workers', risk_score: 78, is_acknowledged: false, timestamp: new Date(Date.now()-120000).toISOString(), agent: 'SimulationAgent' },
    { alert_id: '3', severity: 'medium', category: 'vibration', zone_id: 'Z4', title: 'Abnormal vibration: 9.2 m/s² in Boiler Room', risk_score: 55, is_acknowledged: true, timestamp: new Date(Date.now()-300000).toISOString(), agent: 'RiskAgent' },
  ]
}

export default useAegisStore
