import json
import glob
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

BACKEND_DIR = Path(__file__).parent

LAPTOP_KEYWORDS = ["macbook", "laptop", "notebook", "surface pro", "surface book", "dell xps", "thinkpad"]
TABLET_KEYWORDS = ["ipad", "galaxy tab", "tab s", "tablet", "mediapad", "surface go", "apple watch"]


def detect_category(name: str) -> str:
    n = name.lower()
    if any(k in n for k in LAPTOP_KEYWORDS):
        return "laptop"
    if any(k in n for k in TABLET_KEYWORDS):
        return "tablet"
    return "phone"


def load_inventory() -> list[dict]:
    """Load and merge all *.jsonl files in the backend directory."""
    records = []
    for filepath in sorted(BACKEND_DIR.glob("*.jsonl")):
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        records.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
    return records


def deduplicate(items: list[dict]) -> list[dict]:
    """
    Keep unique listings by (name + price + source).
    Same model at different prices from the same source = separate listings.
    Same model at same price from same source = duplicate, remove.
    """
    seen: set = set()
    result = []
    for item in items:
        name   = (item.get("product_name") or "").strip()
        price  = item.get("price")
        source = (item.get("source_platform") or "").strip()
        if not name or price is None:
            continue
        key = (name.lower(), price, source.lower())
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


def normalize_storage(item: dict) -> str | None:
    """Return a clean storage string like '256GB', '512GB', '1TB'."""
    raw = item.get("storage") or ""
    # Handle formats like "8/512GB", "12+256", "256GB", "1TB"
    for part in raw.replace("+", "/").split("/"):
        part = part.strip().upper()
        if "GB" in part or "TB" in part:
            # Keep only the storage part (e.g., "512GB")
            digits = "".join(c for c in part if c.isdigit())
            unit = "TB" if "TB" in part else "GB"
            if digits:
                return digits + unit
    return None


def format_item(item: dict) -> dict:
    return {
        "name":    item.get("product_name", "Unknown"),
        "price":   item.get("price"),
        "battery": item.get("battery_health"),
        "condition": item.get("physical_condition"),
        "warranty": item.get("warranty_status"),
        "box":     item.get("includes_box"),
        "storage": normalize_storage(item),
        "source":  item.get("source_platform", "Unknown"),
        "link":    item.get("original_link", ""),
        "category": detect_category(item.get("product_name", "")),
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/products")
def get_products():
    """All valid deduplicated listings for the product grid."""
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
    inventory = load_inventory()
    unique = deduplicate(inventory)

    category_key = req.category.lower()
    clean_model  = req.model.replace(" Base", "").lower()

    # Filter to same category only
    cat_items = [i for i in unique if detect_category(i.get("product_name", "")) == category_key]

    # ── Section 1: Same model, all dealers ──────────────────────────────────
    def matches_model(name: str) -> bool:
        n = name.lower()
        return all(word in n for word in clean_model.split())

    same_model = [i for i in cat_items if matches_model(i.get("product_name", ""))]

    # ROM filter — check explicit storage field first, then product name
    if req.roms:
        def rom_match(item: dict) -> bool:
            storage = normalize_storage(item)
            if storage:
                return any(rom.upper() == storage for rom in req.roms)
            return any(rom.lower() in item.get("product_name", "").lower() for rom in req.roms)
        filtered = [i for i in same_model if rom_match(i)]
        same_model = filtered if filtered else same_model  # don't empty the list

    # Budget filter (125% ceiling for section 1)
    budget_ceiling = req.budget * 1.25
    same_budget = [i for i in same_model if i.get("price") and i["price"] <= budget_ceiling]
    same_model_out = same_budget if same_budget else same_model
    same_model_out.sort(key=lambda x: x.get("price") or 999999)

    # ── Section 2: Better options (different model, same category) ──────────
    other = [
        i for i in cat_items
        if not matches_model(i.get("product_name", ""))
        and i.get("price") and i["price"] <= budget_ceiling
    ]
    other.sort(key=lambda x: x.get("price") or 999999)

    # ── Section 3: AI wait suggestion ────────────────────────────────────────
    wait_suggestion = None
    sample_prices = [i["price"] for i in same_model_out[:5] if i.get("price")]
    price_info = (
        "Current prices for {}: {}".format(
            req.model, ", ".join(f"৳{p:,.0f}" for p in sample_prices)
        ) if sample_prices else f"No {req.model} listings found yet."
    )

    try:
        resp = client.chat.completions.create(
            model=ACTIVE_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a concise second-hand phone market analyst for Bangladesh. "
                        "Give only a 2-3 sentence price-trend opinion. "
                        "Never suggest devices of a different category."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"User wants: {req.model} | Budget: ৳{req.budget} | Urgency: {req.urgency}\n"
                        f"{price_info}\n\n"
                        f"Should the user BUY NOW or WAIT? "
                        f"Consider model age, typical price depreciation in Bangladesh, and their urgency. "
                        f"Give a specific timeframe and expected price movement if they wait."
                    )
                }
            ]
        )
        wait_suggestion = resp.choices[0].message.content.strip()
    except Exception:
        wait_suggestion = None

    return {
        "same_model_dealers": [format_item(i) for i in same_model_out[:12]],
        "better_options":     [format_item(i) for i in other[:8]],
        "wait_suggestion":    wait_suggestion,
    }


@app.get("/api/health")
def health():
    inventory = load_inventory()
    unique = deduplicate(inventory)
    sources = {}
    for i in unique:
        s = i.get("source_platform", "Unknown")
        sources[s] = sources.get(s, 0) + 1
    return {"status": "ok", "total": len(unique), "by_source": sources}
