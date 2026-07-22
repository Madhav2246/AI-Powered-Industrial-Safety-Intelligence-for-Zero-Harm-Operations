import React, { useEffect, useRef, useState } from 'react'
import { Map as MapIcon, Users, AlertTriangle, Layers } from 'lucide-react'
import useAegisStore from '../store/aegisStore'

function riskColor(score) {
  if (score < 25) return '#16a34a'
  if (score < 50) return '#d97706'
  if (score < 75) return '#ea580c'
  return '#dc2626'
}

function FactoryMap({ zoneScores }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layersRef = useRef({})

  const FACTORY_GEOJSON = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { id: 'Z1', name: 'Production Floor A' }, geometry: { type: 'Polygon', coordinates: [[[-0.094,51.504],[-0.090,51.504],[-0.090,51.506],[-0.094,51.506],[-0.094,51.504]]] } },
      { type: 'Feature', properties: { id: 'Z2', name: 'Production Floor B' }, geometry: { type: 'Polygon', coordinates: [[[-0.090,51.504],[-0.086,51.504],[-0.086,51.506],[-0.090,51.506],[-0.090,51.504]]] } },
      { type: 'Feature', properties: { id: 'Z3', name: 'Chemical Storage' }, geometry: { type: 'Polygon', coordinates: [[[-0.094,51.502],[-0.090,51.502],[-0.090,51.504],[-0.094,51.504],[-0.094,51.502]]] } },
      { type: 'Feature', properties: { id: 'Z4', name: 'Boiler Room' }, geometry: { type: 'Polygon', coordinates: [[[-0.090,51.502],[-0.086,51.502],[-0.086,51.504],[-0.090,51.504],[-0.090,51.502]]] } },
      { type: 'Feature', properties: { id: 'Z5', name: 'Confined Space A' }, geometry: { type: 'Polygon', coordinates: [[[-0.086,51.504],[-0.083,51.504],[-0.083,51.506],[-0.086,51.506],[-0.086,51.504]]] } },
      { type: 'Feature', properties: { id: 'Z6', name: 'Electrical Room' }, geometry: { type: 'Polygon', coordinates: [[[-0.083,51.502],[-0.080,51.502],[-0.080,51.504],[-0.083,51.504],[-0.083,51.502]]] } },
      { type: 'Feature', properties: { id: 'Z7', name: 'Loading Bay' }, geometry: { type: 'Polygon', coordinates: [[[-0.094,51.506],[-0.090,51.506],[-0.090,51.508],[-0.094,51.508],[-0.094,51.506]]] } },
      { type: 'Feature', properties: { id: 'Z8', name: 'Control Room' }, geometry: { type: 'Polygon', coordinates: [[[-0.090,51.506],[-0.086,51.506],[-0.086,51.508],[-0.090,51.508],[-0.090,51.506]]] } },
    ]
  }

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return

    import('leaflet').then(L => {
      const map = L.map(mapRef.current, {
        center: [51.505, -0.087],
        zoom: 16,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 20,
      }).addTo(map)

      FACTORY_GEOJSON.features.forEach(feature => {
        const zid = feature.properties.id
        const score = zoneScores[zid]?.risk_score || 0
        const color = riskColor(score)

        const layer = L.geoJSON(feature, {
          style: {
            fillColor: color,
            fillOpacity: 0.25,
            color: color,
            weight: 2,
            opacity: 0.8,
          }
        }).addTo(map)

        layer.bindPopup(`
          <div style="font-family: Inter, sans-serif; color: #f9fafb; min-width: 150px;">
            <div style="font-weight: 700; font-size: 13px;">${feature.properties.name}</div>
            <div style="color: ${color}; font-size: 18px; font-weight: 800; margin-top: 4px;">${score.toFixed(0)} / 100</div>
          </div>
        `)

        layersRef.current[zid] = layer
      })

      mapInstanceRef.current = map
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then(() => {
      Object.entries(layersRef.current).forEach(([zid, layer]) => {
        const score = zoneScores[zid]?.risk_score || 0
        const color = riskColor(score)
        layer.setStyle({ fillColor: color, color: color })
      })
    })
  }, [zoneScores])

  return <div ref={mapRef} className="w-full h-full rounded-md border border-[#1f2937]" />
}

export default function MapView() {
  const { zoneRiskScores } = useAegisStore()

  return (
    <div className="flex flex-col h-screen bg-[#0b0f19]">
      <div className="px-6 py-3.5 border-b border-[#1f2937] bg-[#111827] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapIcon size={18} className="text-blue-500" />
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-tight">Geospatial Factory GIS</h1>
            <p className="text-xs text-[#9ca3af]">Spatial risk heatmaps & zone telemetry tracking</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        <div className="flex-1 h-full">
          <FactoryMap zoneScores={zoneRiskScores} />
        </div>

        <div className="w-80 panel-card p-4 flex flex-col space-y-3 overflow-y-auto">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Zone Status Overview</h2>
          {Object.entries(zoneRiskScores).map(([zid, z]) => (
            <div key={zid} className="bg-[#0b0f19] p-3 rounded border border-[#1f2937]">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs font-bold text-white">{zid} — {z.zone_name}</span>
                <span className="font-mono text-xs font-bold" style={{ color: riskColor(z.risk_score) }}>
                  {z.risk_score?.toFixed(0)}
                </span>
              </div>
              <div className="mt-2 h-1 bg-[#1f2937] rounded overflow-hidden">
                <div className="h-full rounded" style={{ width: `${z.risk_score}%`, background: riskColor(z.risk_score) }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
