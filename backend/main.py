import os
import json
import re
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

DATA_FILE = Path(__file__).parent / "marketplace_data.json"


def load_devices():
    with open(DATA_FILE, "r") as f:
        return json.load(f)["devices"]


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    urgency: str = "Medium - Can wait a few weeks"


class UserRequest(BaseModel):
    desired_model: str
    budget: int
    urgency: str


@app.get("/api/health")
def health():
    return {"status": "ok", "gemini_configured": bool(GEMINI_API_KEY)}


@app.get("/api/devices")
def get_devices():
    return load_devices()


@app.post("/api/chat")
def chat(req: ChatRequest):
    devices = load_devices()
    if GEMINI_API_KEY:
        try:
            return _gemini_chat(req, devices)
        except Exception as e:
            print(f"Gemini error: {e}")

    return _local_chat(req, devices)


def _gemini_chat(req: ChatRequest, devices: list) -> dict:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=GEMINI_API_KEY)

    devices_json = json.dumps(devices, indent=2)
    conversation = "\n".join(
        f"{m.role.upper()}: {m.content}" for m in req.messages
    )
    last_user_msg = next(
        (m.content for m in reversed(req.messages) if m.role == "user"), ""
    )

    prompt = f"""You are an expert tech marketplace AI advisor for Bangladesh's second-hand device market. 
You help buyers find the best deals on used phones, laptops, and tablets in BDT (Bangladeshi Taka).

URGENCY LEVEL: {req.urgency}

AVAILABLE MARKETPLACE LISTINGS (JSON):
{devices_json}

CONVERSATION SO FAR:
{conversation}

TASK:
Analyze the user's latest request: "{last_user_msg}"

Respond with a JSON object (no markdown, no code fences, raw JSON only) with this EXACT structure:
{{
  "reply": "A warm, helpful 2-3 sentence conversational message acknowledging their request and summarizing your analysis",
  "verdict": "BUY" or "WAIT" or "SWITCH" or "EXPLORE",
  "verdict_reason": "1-2 sentence explanation of the verdict considering urgency ({req.urgency})",
  "timing_advice": "Specific advice on market timing — whether prices are likely to drop, new models coming, etc.",
  "urgency_advice": "Specific advice based on urgency level",
  "recommendations": [
    {{
      "id": "device id from data",
      "model": "full model name",
      "brand": "brand name",
      "category": "category",
      "price_bdt": number,
      "battery_health": number,
      "condition": "condition",
      "color": "color",
      "storage_gb": number,
      "warranty_months": number,
      "box_included": boolean,
      "source": "marketplace source",
      "deal_score": number,
      "rank": number (1 = best match),
      "match_type": "exact" or "upgrade" or "alternative" or "budget",
      "why_recommended": "2-3 sentence explanation of why this is a great pick for the user",
      "vs_desired": "brief comparison to what the user asked for, highlighting pros/cons"
    }}
  ],
  "comparison_note": "Brief comparison between top picks, highlighting trade-offs",
  "market_insight": "1-2 sentences about the current second-hand market for this category in Bangladesh"
}}

RULES:
- Return 10 to 15 recommendations from the available listings, ranked best to worst for the user's needs
- Always include the device they asked for (if available) AND better alternatives even if they are over budget (mark as upgrade)
- If nothing exactly matches, find the closest alternatives
- Consider: battery health (higher is better), price vs budget, condition, warranty, box, deal score, color preference if mentioned
- Be opinionated — give a clear BUY/WAIT/SWITCH/EXPLORE verdict
- WAIT if: prices likely to drop soon, bad battery health, urgency is low
- BUY if: good deal, within budget, good battery, urgency is high or medium
- SWITCH if: a clearly better device is available at similar or lower price
- EXPLORE if: user hasn't specified enough — ask clarifying questions in the reply
- Prices are in BDT (Bangladeshi Taka ৳)
- Return ONLY valid JSON, no explanation outside the JSON"""

    response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
    text = getattr(response, "text", "") or ""

    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text.strip())

    data = json.loads(text)
    data["source"] = "gemini"
    return data


def _local_chat(req: ChatRequest, devices: list) -> dict:
    last_msg = next(
        (m.content for m in reversed(req.messages) if m.role == "user"), ""
    ).lower()

    keywords = last_msg.split()
    scored = []
    for d in devices:
        score = 0
        model_lower = d["model"].lower()
        brand_lower = d["brand"].lower()
        for kw in keywords:
            if kw in model_lower or kw in brand_lower:
                score += 10
        if d["battery_health"] >= 90:
            score += 5
        if d["condition"] == "Mint":
            score += 4
        if d["box_included"]:
            score += 2
        if d["warranty_months"] > 0:
            score += 3
        score += d["deal_score"] // 20
        scored.append((score, d))

    scored.sort(key=lambda x: -x[0])
    top = scored[:12]

    recommendations = []
    for i, (_, d) in enumerate(top):
        recommendations.append({
            **d,
            "rank": i + 1,
            "match_type": "alternative" if i > 0 else "exact",
            "why_recommended": f"Deal score {d['deal_score']}/100 · {d['battery_health']}% battery · {d['condition']} condition",
            "vs_desired": "Matched based on your description.",
        })

    return {
        "reply": "Here are the best matches I found in our marketplace based on your description.",
        "verdict": "EXPLORE",
        "verdict_reason": "Enable Gemini AI for a smarter personalized verdict.",
        "timing_advice": "Check back regularly as listings update daily.",
        "urgency_advice": f"Your urgency is '{req.urgency}'. Act accordingly.",
        "recommendations": recommendations,
        "comparison_note": "Results sorted by deal score and relevance.",
        "market_insight": "The second-hand tech market in Bangladesh is active with new listings daily.",
        "source": "local",
    }


@app.post("/api/get_recommendation")
def get_recommendation(req: UserRequest):
    chat_req = ChatRequest(
        messages=[
            ChatMessage(
                role="user",
                content=f"I want a {req.desired_model} with a budget of ৳{req.budget:,} BDT.",
            )
        ],
        urgency=req.urgency,
    )
    devices = load_devices()
    if GEMINI_API_KEY:
        try:
            return _gemini_chat(chat_req, devices)
        except Exception:
            pass
    return _local_chat(chat_req, devices)
