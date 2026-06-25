import json
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key="Give your api key here")

INVENTORY_FILE = Path(__file__).parent / "swap_inventory.jsonl"


def load_inventory() -> list[dict]:
    if not INVENTORY_FILE.exists():
        return []
    records = []
    with open(INVENTORY_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return records


class UserRequest(BaseModel):
    desired_model: str
    budget: int
    urgency: str


@app.post("/api/get_recommendation")
def get_recommendation(req: UserRequest):
    inventory = load_inventory()

    budget_ceiling = req.budget * 1.25
    relevant = [
        item for item in inventory
        if item.get("price") and item["price"] <= budget_ceiling
    ]

    if not relevant:
        relevant = inventory[:30]

    inventory_text = ""
    for i, item in enumerate(relevant[:40], 1):
        name = item.get("product_name") or "Unknown"
        price = item.get("price") or "N/A"
        battery = f"{item['battery_health']}%" if item.get("battery_health") else "Unknown"
        condition = item.get("physical_condition") or "Unknown"
        warranty = item.get("warranty_status") or "Unknown"
        box = "Yes" if item.get("includes_box") else ("No" if item.get("includes_box") is False else "Unknown")
        link = item.get("original_link") or ""
        inventory_text += f"{i}. {name} | ৳{price} | Battery: {battery} | Condition: {condition} | Warranty: {warranty} | Box: {box} | Link: {link}\n"

    prompt = f"""You are an expert second-hand smartphone advisor for the Bangladesh market.

User Request:
- Desired Model: {req.desired_model}
- Budget: ৳{req.budget}
- Urgency: {req.urgency}

Available listings from the marketplace:
{inventory_text}

Your task:
1. Recommend the TOP 10-15 best listings that match or are close to the user's request. Rank by value (price + battery + condition).
2. If there is a clearly better phone within 125% of the budget, highlight it as a "Smart Upgrade" with a comparison.
3. Give a final verdict: BUY NOW, WAIT, or SWITCH MODEL — with a short reason based on price trends, model age, and availability.
4. Keep each recommendation to 1-2 lines. Be direct and practical.

Format your response as:
## Top Picks
(numbered list)

## Smart Upgrade (if applicable)
(1-2 sentences)

## Verdict: [BUY NOW / WAIT / SWITCH MODEL]
(2-3 sentences of reasoning)
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )

    return {"ai_verdict": response.choices[0].message.content}


@app.get("/api/health")
def health():
    inventory = load_inventory()
    return {"status": "ok", "inventory_count": len(inventory)}
