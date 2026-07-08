from typing import Optional
import json
import glob
import difflib
from datetime import date
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # If the package isn't found (like on Vercel), just ignore it! 
    # Vercel handles environment variables natively anyway.
    pass



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
USE_OLLAMA = False

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OLLAMA_MODEL   = "llama3.2"
OPENAI_MODEL   = "gemini-2.5-flash"

if USE_OLLAMA:
    client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
    ACTIVE_MODEL = OLLAMA_MODEL
else:
    client = OpenAI(
        api_key=OPENAI_API_KEY, 
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )
    ACTIVE_MODEL = OPENAI_MODEL
# ─────────────────────────────────────────────────────────────────────────────

BACKEND_DIR = Path(__file__).resolve().parent / "data" 

LAPTOP_KEYWORDS = ["macbook", "laptop", "notebook", "surface pro", "surface book", "dell xps", "thinkpad"]
TABLET_KEYWORDS = ["ipad", "galaxy tab", "tab s", "tablet", "mediapad", "surface go", "apple watch"]


def detect_category(name: str) -> str:
    n = name.lower()
    if any(k in n for k in LAPTOP_KEYWORDS):
        return "laptop"
    if any(k in n for k in TABLET_KEYWORDS):
        return "tablet"
    return "phone"


# Brand detection — used only for the AI advisory's release-cycle reasoning.
BRAND_PATTERNS = [
    (["iphone", "ipad", "macbook", "apple watch", "apple"], "Apple"),
    (["samsung", "galaxy"], "Samsung"),
    (["xiaomi", "redmi", "poco"], "Xiaomi"),
    (["pixel", "google"], "Google"),
    (["oneplus"], "OnePlus"),
    (["huawei", "honor"], "Huawei"),
    (["oppo"], "Oppo"),
    (["vivo"], "Vivo"),
    (["realme"], "Realme"),
    (["dell", "xps"], "Dell"),
    (["lenovo", "thinkpad"], "Lenovo"),
    (["asus"], "Asus"),
    (["hp ", "hewlett"], "HP"),
    (["microsoft", "surface"], "Microsoft"),
]


def fuzzy_word_in(query_word: str, target_words: list[str], threshold: float = 0.78) -> bool:
    """
    True if query_word matches one of target_words closely enough to tolerate
    a small typo (e.g. "iphoen" -> "iphone"). Purely numeric words (model
    numbers like "17", "14") must match EXACTLY — fuzzy tolerance there would
    let "iPhone 17" incorrectly match "iPhone 14" listings just because the
    strings are similar length.
    """
    if query_word.isdigit():
        return query_word in target_words
    if query_word in target_words:
        return True
    return any(difflib.SequenceMatcher(None, query_word, tw).ratio() >= threshold for tw in target_words)


def detect_brand(name: str) -> str:
    n = name.lower()
    for keywords, brand in BRAND_PATTERNS:
        if any(k in n for k in keywords):
            return brand
    return "Other"


# General knowledge fed to the AI so it can reason about "a new model is
# probably coming soon, so this one's resale price will likely soften."
RELEASE_CYCLE_HINTS = {
    "Apple": (
        "Apple usually releases new iPhones every September, and refreshes MacBooks/iPads on their own "
        "spring or fall cadence. Resale prices on the outgoing iPhone model commonly soften 10-20% within "
        "4-8 weeks after the new September launch."
    ),
    "Samsung": (
        "Samsung usually releases new Galaxy S flagships every January/February, and new Galaxy Z Fold/Flip "
        "foldables every July/August. Resale prices on the outgoing model in that line commonly drop shortly "
        "after the new one is unveiled."
    ),
    "Google": (
        "Google usually releases new Pixel phones every August/October, after which the previous generation's "
        "resale price typically softens within a month or two."
    ),
    "OnePlus": (
        "OnePlus usually releases a new numbered flagship every spring with a lighter refresh in autumn, after "
        "which older models get noticeably cheaper on the resale market."
    ),
    "Xiaomi": (
        "Xiaomi/Redmi/POCO release new numbered series multiple times a year, so resale prices on this brand "
        "tend to fall faster and more often than Apple or Samsung."
    ),
}
DEFAULT_RELEASE_HINT = (
    "This brand typically refreshes its lineup roughly once a year, and resale prices on the outgoing model "
    "usually soften a few weeks after a new one is announced."
)


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


def normalize_storage(item: dict) -> Optional[str]:
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


CONDITION_SCORE = {
    "excellent": 5.0,
    "apple replacement": 5.0,
    "good": 4.0,
    "minimal scratches on display": 3.5,
    "refurbished": 3.0,
    "used": 2.0,
    "fair": 1.0,
}


def score_item(item: dict, target_budget: float) -> float:
    """
    Higher = better value. Rewards good condition/battery/warranty/box,
    and penalizes listings that are far away in price from what the user
    is actually targeting — so cheap-but-irrelevant junk stops floating
    to the top just because it's "technically within budget."
    """
    score = 0.0
    cond = (item.get("physical_condition") or "").strip().lower()
    score += CONDITION_SCORE.get(cond, 2.5)  # unknown condition = middling assumption

    battery = item.get("battery_health")
    if isinstance(battery, (int, float)):
        score += battery / 25.0  # up to +4 for a mint 100% battery

    if item.get("warranty_status"):
        score += 1.5
    if item.get("includes_box"):
        score += 1.0

    price = item.get("price")
    if price and target_budget:
        distance_ratio = abs(price - target_budget) / target_budget
        score -= distance_ratio * 3.0  # penalize being far from the target budget

    return score


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
        target_words = name.lower().split()
        return all(fuzzy_word_in(qw, target_words) for qw in clean_model.split())

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

    # ── Section 2: Better options — genuine near-budget alternatives ────────
    # Instead of "anything cheaper than budget", only surface models priced
    # close to what the user actually selected: a little less (save money)
    # or a little more (small upgrade) — scored by real condition/battery/
    # warranty quality, not just sorted by raw price ascending.
    other_pool = [i for i in cat_items if not matches_model(i.get("product_name", ""))]

    band = max(req.budget * 0.15, 15_000)
    lower_bound = max(req.budget - band, 0)
    upper_bound = req.budget + band

    def in_band(i: dict, lo: float, hi: float) -> bool:
        p = i.get("price")
        return p is not None and lo <= p <= hi

    other = [i for i in other_pool if in_band(i, lower_bound, upper_bound)]

    # Widen the band up to twice if too few genuinely-nearby options exist,
    # rather than falling back to showing everything under budget again.
    widen_attempts = 0
    while len(other) < 3 and widen_attempts < 2:
        band *= 2
        lower_bound = max(req.budget - band, 0)
        upper_bound = req.budget + band
        other = [i for i in other_pool if in_band(i, lower_bound, upper_bound)]
        widen_attempts += 1

    other.sort(key=lambda x: score_item(x, req.budget), reverse=True)

    # ── Section 3: AI wait / upgrade suggestion ──────────────────────────────
    brand = detect_brand(req.model)
    release_hint = RELEASE_CYCLE_HINTS.get(brand, DEFAULT_RELEASE_HINT)
    today = date.today().isoformat()

    wait_suggestion = None
    sample_prices = [i["price"] for i in same_model_out[:5] if i.get("price")]
    price_info = (
        "Current prices for {}: {}".format(
            req.model, ", ".join(f"৳{p:,.0f}" for p in sample_prices)
        ) if sample_prices else f"No {req.model} listings found yet."
    )

    # Real "spend a bit more" candidates, strictly above the near-budget band,
    # so the AI can name a concrete, currently-in-stock upgrade path instead
    # of inventing a model name or price.
    upgrade_pool = [i for i in other_pool if i.get("price") and i["price"] > upper_bound]
    upgrade_pool.sort(key=lambda x: score_item(x, req.budget + band), reverse=True)
    upgrade_candidates = upgrade_pool[:3]

    if upgrade_candidates:
        upgrade_lines = "\n".join(
            f"- {i.get('product_name', 'Unknown')} at ৳{i['price']:,.0f} from {i.get('source_platform', 'Unknown')}"
            for i in upgrade_candidates
        )
        upgrade_text = f"Real upgrade options currently in stock, a bit above budget:\n{upgrade_lines}"
    else:
        upgrade_text = "No upgrade-tier alternatives are currently in stock near this budget range."

    try:
        resp = client.chat.completions.create(
            model=ACTIVE_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a sharp, concise second-hand tech market analyst for Bangladesh. "
                        "You give practical buy-now-vs-wait advice using ONLY the real data given to you in "
                        "the prompt — never invent a model name or price that wasn't provided. "
                        "You understand that resale prices for a phone/tablet/laptop model typically soften "
                        "10-20% within a few weeks to a couple of months after the manufacturer launches its "
                        "successor, and you factor in the specific brand's known release cycle given to you below. "
                        "Never suggest devices of a different category than the one requested. "
                        "Respond in 4-6 tight, specific sentences. No headers, no bullet points, no markdown."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Today's date: {today}\n"
                        f"User wants: {req.model} (brand: {brand}) | Category: {req.category} | "
                        f"Budget: ৳{req.budget:,} | Urgency: {req.urgency}\n"
                        f"{price_info}\n"
                        f"Brand release pattern: {release_hint}\n"
                        f"{upgrade_text}\n\n"
                        f"Write advice covering:\n"
                        f"1) Buy now or wait, and roughly how long, based on the brand's release pattern and "
                        f"typical resale depreciation.\n"
                        f"2) Only if urgency is 'flexible' or 'soon' AND a real upgrade option was listed above: "
                        f"name that specific real model and its real price as a worthwhile step-up if the user "
                        f"can stretch their budget by about ৳10,000-20,000. If no upgrade option was listed, "
                        f"do not invent one — just say none is currently available near that range.\n"
                        f"3) If urgency is 'urgent', recommend buying now regardless of any expected price drop."
                    )
                }
            ]
        )
        wait_suggestion = resp.choices[0].message.content.strip()
    except Exception as e:
        # Full detail goes to your terminal for debugging; the user only
        # sees a friendly message, never a raw stack trace.
        print(f"[ai-analyze] AI call failed: {type(e).__name__}: {e}")
        wait_suggestion = (
            "The AI advisor is temporarily unavailable. Make sure Ollama "
            "(or your configured model provider) is running, then try again."
        )

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

