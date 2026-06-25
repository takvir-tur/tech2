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

# ── TOGGLE HERE ──────────────────────────────────────────────────────────────
# Local testing with Ollama : USE_OLLAMA = True
# Final submission with OpenAI: USE_OLLAMA = False + set OPENAI_API_KEY
USE_OLLAMA = True

OPENAI_API_KEY = "paste-your-openai-key-here"
OLLAMA_MODEL   = "llama3.2"
OPENAI_MODEL   = "gpt-4o-mini"

if USE_OLLAMA:
    client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
    ACTIVE_MODEL = OLLAMA_MODEL
else:
    client = OpenAI(api_key=OPENAI_API_KEY)
    ACTIVE_MODEL = OPENAI_MODEL
# ─────────────────────────────────────────────────────────────────────────────

INVENTORY_FILE = Path(__file__).parent / "swap_inventory.jsonl"

LAPTOP_KEYWORDS = ["macbook", "laptop", "notebook", "surface pro", "surface book", "dell xps", "hp spectre", "thinkpad"]
TABLET_KEYWORDS = ["ipad", "galaxy tab", "tab s", "tablet", "mediapad", "surface go"]


def detect_category(name: str) -> str:
    n = name.lower()
    if any(k in n for k in LAPTOP_KEYWORDS):
        return "laptop"
    if any(k in n for k in TABLET_KEYWORDS):
        return "tablet"
    return "phone"


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


def deduplicate(items: list[dict]) -> list[dict]:
    """Remove duplicate entries (same name + price)."""
    seen: set = set()
    result = []
    for item in items:
        name  = (item.get("product_name") or "").strip()
        price = item.get("price")
        if not name or price is None:
            continue
        key = (name.lower(), price)
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


def format_item(item: dict) -> dict:
    """Return a clean dict for frontend consumption."""
    return {
        "name":           item.get("product_name", "Unknown"),
        "price":          item.get("price"),
        "battery_health": item.get("battery_health"),
        "condition":      item.get("physical_condition"),
        "warranty":       item.get("warranty_status"),
        "box":            item.get("includes_box"),
        "source":         item.get("source_platform", "Unknown"),
        "link":           item.get("original_link", ""),
        "category":       detect_category(item.get("product_name", "")),
    }


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/api/products")
def get_products():
    """Returns all valid, deduplicated inventory items for the product grid."""
    inventory = load_inventory()
    unique = deduplicate(inventory)
    return {"products": [format_item(i) for i in unique]}


class AnalyzeRequest(BaseModel):
    category: str          # "Phone" | "Tablet" | "Laptop"
    model: str             # e.g. "iPhone 14 Pro"
    roms: list[str] = []   # e.g. ["256GB", "512GB"]
    budget: int
    min_battery: int = 0
    condition: str = "any"
    urgency: str = "flexible"


@app.post("/api/ai-analyze")
def ai_analyze(req: AnalyzeRequest):
    """
    Returns 3 sections:
      1. same_model_dealers  – exact model, different sellers
      2. better_options      – other models within budget, same category
      3. wait_suggestion     – AI-generated price-trend advice (optional)
    """
    inventory = load_inventory()
    unique = deduplicate(inventory)

    category_key = req.category.lower()   # "phone" | "tablet" | "laptop"
    clean_model  = req.model.replace(" Base", "").lower()

    # Filter to same category only
    cat_items = [i for i in unique if detect_category(i.get("product_name", "")) == category_key]

    # ── Section 1: Same model, all dealers ──────────────────────────────────
    def matches_model(name: str) -> bool:
        n = name.lower()
        # All words in clean_model must appear in name
        return all(word in n for word in clean_model.split())

    same_model = [i for i in cat_items if matches_model(i.get("product_name", ""))]

    # Apply ROM filter if selected
    if req.roms:
        same_model = [
            i for i in same_model
            if any(rom.lower() in i.get("product_name", "").lower() for rom in req.roms)
        ] or same_model  # fall back to unfiltered if nothing matches

    # Apply budget ceiling
    budget_ceiling = req.budget * 1.25
    same_model_filtered = [i for i in same_model if i.get("price") and i["price"] <= budget_ceiling]
    if not same_model_filtered:
        same_model_filtered = same_model  # show anyway if budget is tight

    same_model_filtered.sort(key=lambda x: x.get("price") or 999999)

    # ── Section 2: Better options (different model, same category, in budget) ─
    other = [
        i for i in cat_items
        if not matches_model(i.get("product_name", ""))
        and i.get("price") and i["price"] <= budget_ceiling
    ]
    other.sort(key=lambda x: x.get("price") or 999999)

    # ── Section 3: AI wait suggestion ────────────────────────────────────────
    wait_suggestion = None
    sample_prices = [i["price"] for i in same_model_filtered[:5] if i.get("price")]
    price_info = (
        f"Current prices for {req.model}: " + ", ".join(f"৳{p:,.0f}" for p in sample_prices)
        if sample_prices else f"No {req.model} listings found yet."
    )

    try:
        wait_text = client.chat.completions.create(
            model=ACTIVE_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a concise second-hand phone market analyst for Bangladesh. "
                        "Give only a 2-3 sentence price-trend opinion. Never suggest phones of a different category."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"User wants: {req.model} | Budget: ৳{req.budget} | Urgency: {req.urgency}\n"
                        f"{price_info}\n\n"
                        f"Should the user BUY NOW or WAIT? "
                        f"Consider model age, typical price depreciation in Bangladesh, and their urgency. "
                        f"Give a specific timeframe and expected price movement."
                    )
                }
            ]
        )
        wait_suggestion = wait_text.choices[0].message.content.strip()
    except Exception:
        wait_suggestion = None

    return {
        "same_model_dealers": [format_item(i) for i in same_model_filtered[:10]],
        "better_options":     [format_item(i) for i in other[:8]],
        "wait_suggestion":    wait_suggestion,
    }


@app.get("/api/health")
def health():
    inventory = load_inventory()
    return {"status": "ok", "inventory_count": len(inventory)}
