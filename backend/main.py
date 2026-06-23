import os

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

# Marketplace listings in BDT — aligned with frontend `src/lib/products.ts`
scraped_database = [
    {"model": "iPhone 14 Pro 256GB", "price_bdt": 92000, "battery": "94%", "condition": "Mint"},
    {"model": 'MacBook Air M2 13"', "price_bdt": 109000, "battery": "91%", "condition": "Mint"},
    {"model": "Galaxy S23 Ultra 512GB", "price_bdt": 82500, "battery": "88%", "condition": "Good"},
    {"model": 'iPad Pro 11" M2', "price_bdt": 78000, "battery": "96%", "condition": "Mint"},
    {"model": "iPhone 13 128GB", "price_bdt": 54000, "battery": "82%", "condition": "Good"},
    {"model": "Galaxy Z Fold 5", "price_bdt": 132000, "battery": "97%", "condition": "Mint"},
    {"model": 'MacBook Pro 14" M3', "price_bdt": 192000, "battery": "99%", "condition": "Mint"},
    {"model": "Galaxy Tab S9+ 256GB", "price_bdt": 64500, "battery": "90%", "condition": "Good"},
    {"model": "iPhone 14 Pro 128GB", "price_bdt": 81000, "battery": "86%", "condition": "Fair"},
    {"model": "Galaxy S23 128GB", "price_bdt": 51500, "battery": "93%", "condition": "Mint"},
]


class UserRequest(BaseModel):
    desired_model: str
    budget: int
    urgency: str


def _local_verdict(req: UserRequest) -> str:
    query = req.desired_model.lower()
    matches = [
        item
        for item in scraped_database
        if query in item["model"].lower() and item["price_bdt"] <= req.budget
    ]
    upgrades = [
        item
        for item in scraped_database
        if item["price_bdt"] <= req.budget and item not in matches
    ]
    upgrades.sort(key=lambda item: item["price_bdt"], reverse=True)

    if matches:
        best = min(matches, key=lambda item: item["price_bdt"])
        lines = [
            f"BUY — {best['model']} at ৳{best['price_bdt']:,} fits your ৳{req.budget:,} budget.",
            f"Battery {best['battery']}, condition {best['condition']}.",
        ]
        if upgrades:
            alt = upgrades[0]
            lines.append(
                f"Smart upgrade: {alt['model']} at ৳{alt['price_bdt']:,} ({alt['condition']})."
            )
        return "\n".join(lines)

    if upgrades:
        alt = upgrades[0]
        return (
            f"SWITCH — No exact match for '{req.desired_model}' under ৳{req.budget:,}. "
            f"Consider {alt['model']} at ৳{alt['price_bdt']:,}."
        )

    cheapest = min(scraped_database, key=lambda item: item["price_bdt"])
    return (
        f"WAIT — Nothing under ৳{req.budget:,}. "
        f"Cheapest listing: {cheapest['model']} at ৳{cheapest['price_bdt']:,}. "
        f"Urgency: {req.urgency}."
    )


def _gemini_verdict(req: UserRequest) -> str:
    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)

    prompt = f"""
User wants a {req.desired_model} with a budget of ৳{req.budget:,} BDT (Urgency: {req.urgency}).

Available scraped marketplace data (prices in Bangladeshi Taka):
{scraped_database}

1. Filter out suitable phones/devices.
2. Suggest a 'Smart Upgrade' if a better model fits their budget.
3. Output a clear comparison, market context, and a definitive decision: BUY, WAIT, or SWITCH.
"""

    response = model.generate_content(prompt)
    text = getattr(response, "text", None)
    if not text:
        raise ValueError("Gemini returned empty response")
    return text


@app.get("/api/health")
def health():
    return {"status": "ok", "gemini_configured": bool(GEMINI_API_KEY)}


@app.post("/api/get_recommendation")
def get_recommendation(req: UserRequest):
    if GEMINI_API_KEY:
        try:
            return {"ai_verdict": _gemini_verdict(req), "source": "gemini"}
        except Exception:
            pass

    return {"ai_verdict": _local_verdict(req), "source": "local"}
