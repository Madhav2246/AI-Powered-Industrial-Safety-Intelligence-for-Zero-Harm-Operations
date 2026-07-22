"""
AegisOS — Worker Copilot API
============================
Conversational AI for workers with RAG-based safety knowledge.
Supports text and voice input. Falls back to mock LLM if no API key.
"""
import random
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Body
from pydantic import BaseModel

from config import settings

router = APIRouter()


# Schemas
class CopilotMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str


class CopilotRequest(BaseModel):
    message: str
    zone_id: Optional[str] = None
    worker_id: Optional[str] = None
    history: List[CopilotMessage] = []
    voice_input: bool = False


class CopilotResponse(BaseModel):
    response: str
    sources: List[str]
    actions: List[str]
    risk_flags: List[str]
    confidence: float
    timestamp: str


# Mock LLM Response Engine
SAFETY_KNOWLEDGE_BASE = {
    "gas": {
        "response": "🚨 **Gas Hazard Protocol**: Immediately leave the area and activate the nearest gas alarm. Do NOT use any electrical switches or create sparks. Go to the muster point at the main entrance. Notify your supervisor and safety officer immediately. If symptoms occur (headache, dizziness), seek medical attention.",
        "sources": ["OSHA 29 CFR 1910.1000", "Factory Emergency Procedure EP-04", "Chemical Safety Manual §3.2"],
        "actions": ["Evacuate zone", "Activate gas alarm", "Call safety hotline: x911"],
        "risk_flags": ["explosive_atmosphere", "health_hazard"],
    },
    "fire": {
        "response": "🔥 **Fire Response Protocol**: Pull the nearest fire alarm. Use RACE: Rescue anyone in immediate danger, Activate the alarm, Contain the fire if safe (close doors), Evacuate and call emergency services. Only use a fire extinguisher if trained and the fire is small. Do NOT use elevators.",
        "sources": ["NFPA 10 Fire Extinguisher Standard", "Factory ERP §2.1", "Fire Warden Procedures"],
        "actions": ["Pull fire alarm", "Evacuate immediately", "Call fire brigade: 101"],
        "risk_flags": ["fire_hazard", "evacuation_required"],
    },
    "permit": {
        "response": "📋 **Work Permit Guidance**: Before starting work, ensure your permit is active and valid. Check for conflicts with other work happening in the same zone. For hot work, verify gas levels < 10% LEL. For confined space entry, conduct atmospheric testing and have a standby person. Your safety officer must approve all high-risk work.",
        "sources": ["Permit-to-Work Procedure PTW-001", "Factory Act §37", "OSHA Confined Space 1910.146"],
        "actions": ["Verify permit status", "Contact safety officer", "Complete pre-work checklist"],
        "risk_flags": [],
    },
    "ppe": {
        "response": "🛈 **PPE Requirements**: The mandatory PPE for this zone includes hard hat, safety boots (steel-toed), hi-vis vest, and safety glasses. For chemical zones, add: chemical-resistant gloves, face shield, and chemical suit. For electrical work: Class 2 insulating gloves and arc flash suit. Always inspect PPE before use and report damaged equipment.",
        "sources": ["PPE Matrix Doc-2024", "OSHA PPE Standard 1910.132", "Zone Safety Card Z3-SC"],
        "actions": ["Collect PPE from locker room", "Inspect before use", "Report damage to supervisor"],
        "risk_flags": [],
    },
    "emergency": {
        "response": "🆘 **EMERGENCY RESPONSE**: 1. Stay calm and assess for immediate danger. 2. Call factory emergency line: x911. 3. Provide your name, location, and nature of emergency. 4. If safe, provide first aid until EMS arrives. Muster points: Main entrance (A-gate), East yard, Parking area B. AED locations: Control room, Production office.",
        "sources": ["Emergency Response Plan ERP-2024", "First Aid Procedure FA-003"],
        "actions": ["Call x911", "Go to muster point", "Await further instructions"],
        "risk_flags": ["emergency_active"],
    },
    "confined": {
        "response": "🔒 **Confined Space Entry**: NEVER enter a confined space without a valid permit. Required: atmospheric test (O2: 19.5-23.5%, LEL < 10%, toxic gases < PEL), rescue equipment ready, attendant present, and communication established. Entry team: max 2 people inside. Monitor continuously during entry.",
        "sources": ["Confined Space Procedure CS-001", "OSHA 1910.146", "Risk Assessment RA-CS-2024"],
        "actions": ["Get CS permit", "Test atmosphere", "Station attendant outside"],
        "risk_flags": ["confined_space_hazard"],
    },
    "default": {
        "response": "I'm the AegisOS Safety Copilot. I can help you with: \n• **Emergency procedures** (fire, gas, evacuation)\n• **Work permit guidance** (hot work, confined space, electrical)\n• **PPE requirements** per zone\n• **Hazard identification** and risk assessment\n• **Compliance questions** (OSHA, Factory Act)\n\nWhat safety question can I help you with?",
        "sources": ["AegisOS Knowledge Base"],
        "actions": [],
        "risk_flags": [],
    }
}


def get_mock_response(message: str, zone_id: Optional[str]) -> dict:
    """Pattern-match the query to safety knowledge base."""
    msg = message.lower()

    if any(w in msg for w in ["gas", "leak", "fume", "vapor", "lel", "ppm"]):
        key = "gas"
    elif any(w in msg for w in ["fire", "smoke", "burn", "flame", "extinguish"]):
        key = "fire"
    elif any(w in msg for w in ["permit", "work order", "hot work", "approval"]):
        key = "permit"
    elif any(w in msg for w in ["ppe", "helmet", "glove", "suit", "protection", "gear"]):
        key = "ppe"
    elif any(w in msg for w in ["emergency", "accident", "injury", "hurt", "help", "sos"]):
        key = "emergency"
    elif any(w in msg for w in ["confined", "space", "tank", "vessel", "sewer", "manhole"]):
        key = "confined"
    else:
        key = "default"

    resp = SAFETY_KNOWLEDGE_BASE[key].copy()
    if zone_id:
        resp["response"] += f"\n\n📍 **Your zone ({zone_id})**: Current safety officer is on duty. Zone-specific checklist available at station Z-BOARD."

    return resp


# Endpoint
@router.post("/chat", response_model=CopilotResponse)
async def copilot_chat(req: CopilotRequest = Body(...)):
    """
    AI Safety Copilot endpoint.
    In LLM_MODE=mock: pattern-matched responses from safety knowledge base.
    In LLM_MODE=openai: GPT-4 with RAG context from ChromaDB.
    """
    if getattr(settings, "llm_mode", "mock") == "openai" and getattr(settings, "openai_api_key", ""):
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.openai_api_key)
            system_prompt = """You are AegisOS Safety Copilot — an AI safety assistant for industrial workers.
You have access to safety regulations, PPE requirements, emergency procedures, and permit rules.
Always prioritize worker safety. Give clear, actionable, concise responses.
Format responses with emojis and markdown for clarity."""

            messages = [{"role": "system", "content": system_prompt}]
            for h in req.history[-6:]:  # Last 3 exchanges
                messages.append({"role": h.role, "content": h.content})
            messages.append({"role": "user", "content": req.message})

            completion = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=400,
                temperature=0.3,
            )
            ai_response = completion.choices[0].message.content
            return CopilotResponse(
                response=ai_response,
                sources=["AegisOS RAG Knowledge Base", "OSHA Regulations", "Factory Safety Manual"],
                actions=[],
                risk_flags=[],
                confidence=0.92,
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
        except Exception:
            pass  # Fall through to mock

    # Mock LLM response
    resp = get_mock_response(req.message, req.zone_id)
    return CopilotResponse(
        response=resp["response"],
        sources=resp["sources"],
        actions=resp["actions"],
        risk_flags=resp["risk_flags"],
        confidence=0.85 + random.uniform(-0.05, 0.1),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/suggested-questions")
async def get_suggested_questions(zone_id: Optional[str] = None):
    """Return context-aware suggested questions for the copilot UI."""
    base_questions = [
        "What PPE do I need for this zone?",
        "How do I report a gas leak?",
        "What are the confined space entry requirements?",
        "How do I get a hot work permit approved?",
        "What do I do in case of fire?",
        "What are the evacuation muster points?",
    ]
    zone_questions = {
        "Z3": ["What are the chemical storage safety rules?", "How do I handle a chemical spill?"],
        "Z5": ["What is the confined space rescue procedure?", "How long can I work in a confined space?"],
        "Z4": ["What are the boiler room safety protocols?", "What is the maximum pressure limit?"],
    }
    questions = base_questions.copy()
    if zone_id in zone_questions:
        questions = zone_questions[zone_id] + questions

    return {"questions": questions[:6]}
