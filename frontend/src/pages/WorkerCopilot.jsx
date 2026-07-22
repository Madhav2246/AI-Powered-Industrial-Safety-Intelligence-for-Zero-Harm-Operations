import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Mic, MicOff, Bot, User, Shield, BookOpen } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SUGGESTED = [
  "What PPE do I need for hot work?",
  "How do I report a gas leak in Z3?",
  "What are confined space entry requirements?",
  "What's the evacuation procedure for chemical spills?",
]

function getMockResponse(text) {
  const t = text.toLowerCase()
  if (t.includes('gas') || t.includes('leak')) return {
    response: "OPERATIONAL SAFETY PROTOCOL — GAS HAZARD\n\n1. Immediately evacuate Zone Z3 via North Exit.\n2. Do NOT actuate electrical switches or equipment.\n3. Report to Assembly Point Alpha (Main Entrance).\n4. Notify Duty Safety Officer at extension x911.\n\nThreshold Limits:\n- Warning Level: 200 ppm\n- Critical LEL Level: 500 ppm",
    sources: ["OSHA 29 CFR 1910.1000", "Plant Procedure EP-04"],
  }
  if (t.includes('ppe') || t.includes('helmet') || t.includes('glove')) return {
    response: "MANDATORY PPE SPECIFICATION — HOT WORK\n\n- Fire-Resistant Outerwear (Class 2)\n- Face Shield & Impact Goggles\n- Heavy Leather Welding Gloves\n- Steel-Toed Dielectric Safety Boots\n- Industrial Hard Hat (ANSI Z89.1)",
    sources: ["PPE Matrix Doc-2026", "OSHA 1910.132"],
  }
  return {
    response: "AegisOS Operational Safety Assistant active.\n\nI can assist with:\n• Emergency procedures (fire, gas containment, evacuation)\n• Permit-to-Work (PTW) isolation protocols\n• Mandatory PPE requirements per zone\n• Regulatory standards (OSHA, Factories Act)",
    sources: ["AegisOS Safety Index"],
  }
}

export default function WorkerCopilot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "AegisOS Operational Assistant ready. Enter a safety query or select a standard prompt below.",
      sources: ["Plant Safety Index v2026.1"],
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedZone, setSelectedZone] = useState('Z1')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/v1/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          zone_id: selectedZone,
          history: messages.slice(-6),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          sources: data.sources || [],
        }])
      } else throw new Error()
    } catch {
      const mock = getMockResponse(text)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: mock.response,
        sources: mock.sources,
      }])
    } finally {
      setLoading(false)
    }
  }

  const ZONES = ['Z1','Z2','Z3','Z4','Z5','Z6','Z7','Z8']

  return (
    <div className="flex flex-col h-screen bg-[#0b0f19]">
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-[#1f2937] bg-[#111827] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare size={18} className="text-blue-500" />
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-tight">Safety Copilot Assistant</h1>
            <p className="text-xs text-[#9ca3af]">Context-aware safety intelligence & regulatory guidelines</p>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#9ca3af]">ZONE:</span>
          <select value={selectedZone} onChange={e => setSelectedZone(e.target.value)} className="text-xs py-1 px-2">
            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3.5 rounded border text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-100 font-medium'
                    : 'bg-[#111827] border-[#1f2937] text-gray-200'
                }`}>
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#1f2937] flex flex-wrap gap-1">
                      {msg.sources.map(s => (
                        <span key={s} className="text-[10px] font-mono text-[#9ca3af] bg-[#0b0f19] px-1.5 py-0.5 rounded border border-[#1f2937]">
                          REF: {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-[#6b7280] font-mono">Querying Safety Index...</div>}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t border-[#1f2937] bg-[#111827]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage(input) }}
                placeholder="Ask safety question (e.g. PPE required for confined space entry)..."
                className="flex-1 text-xs px-3 py-2.5"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded transition-colors"
              >
                Send Query
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 border-l border-[#1f2937] bg-[#111827] p-4 space-y-3">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={14} className="text-indigo-400" /> Standard Queries
          </h2>
          <div className="space-y-2">
            {SUGGESTED.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="w-full text-left text-xs text-[#9ca3af] hover:text-white bg-[#0b0f19] hover:bg-[#1f2937] p-2.5 rounded border border-[#1f2937] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
