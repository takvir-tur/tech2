"""
swap_scraper.py
===============
Production-ready, fault-tolerant web scraper for SWAP.com.bd smartphone listings.

Architecture:
  - Undetected ChromeDriver    → Bypasses bot fingerprinting at the TLS/browser level
  - Cloudflare Turnstile Guard → Handles surprise checkpoint interceptions mid-scrape
  - BeautifulSoup              → Fast HTML parsing on the already-rendered DOM
  - JSONL Appender             → Crash-proof, line-by-line output for streaming pipelines

Target:  https://swap.com.bd/buy/collection-list?id=6
Output:  swap_inventory.jsonl  (one JSON object per line, UTF-8)

Usage:
  pip install undetected-chromedriver beautifulsoup4 selenium
  python swap_scraper.py
"""

import json
import re
import time
import random
import logging
from datetime import datetime, timezone
from pathlib import Path

import undetected_chromedriver as uc
from bs4 import BeautifulSoup
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# ──────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ──────────────────────────────────────────────────────────────────────────────

# The base collection URL. The page query param will be appended dynamically.
BASE_COLLECTION_URL = "https://swap.com.bd/buy/collection-list?id=6"

# JSONL output file — opened in append mode so a crash never loses prior data.
OUTPUT_FILE = Path("swap_inventory.jsonl")

# How many collection pages to attempt. Adjust based on actual pagination depth.
# The scraper will also stop early if it detects an empty page (end of results).
MAX_PAGES = 50

# Human-like delay ranges (seconds) — keeps request cadence within organic bounds.
PAGE_DELAY_RANGE   = (2.5, 5.0)   # Between list page navigations
DETAIL_DELAY_RANGE = (2.0, 4.5)   # Between individual product page visits
CF_WAIT_SECONDS    = 10           # Time given to Cloudflare Turnstile to auto-solve

# Hardcoded platform identifier written into every record.
SOURCE_PLATFORM = "SWAP"

# Chrome major version — match your locally installed Chrome.
# Run `google-chrome --version` or `chromium --version` to check.
CHROME_VERSION = 136


# ──────────────────────────────────────────────────────────────────────────────
# LOGGING SETUP
# ──────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("swap_scraper")


# ──────────────────────────────────────────────────────────────────────────────
# ANTI-BOT DEFENSE LAYER
# ──────────────────────────────────────────────────────────────────────────────

def handle_surprise_cloudflare(driver: uc.Chrome) -> bool:
    """
    Check if the browser is currently stuck on a Cloudflare verification wall
    and wait safely for it to resolve without crashing the script.
    """
    cf_titles = ["Just a moment", "Cloudflare", "Attention Required", "Security Check", "DDoS-Guard"]
    
    try:
        # Safely attempt to get the title. If Chrome crashed, this triggers the exception.
        current_title = driver.title
    except Exception:
        log.warning("  ⚠️  Browser window was unresponsive or closed during title check.")
        return False

    # Check the safely captured title
    if not any(indicator in current_title for indicator in cf_titles):
        return False  # Normal page — no challenge detected.

    log.info("🔒  Cloudflare challenge detected! Waiting for pass...")
    
    # Wait up to 30 seconds for the Turnstile to auto-clear
    for _ in range(30):
        try:
            time.sleep(1)
            # Check safely in the loop
            if not any(indicator in driver.title for indicator in cf_titles):
                log.info("✅  Cloudflare wall cleared successfully!")
                return True
        except Exception:
            # If the window crashes while waiting, break out safely
            break
            
    return False


# ──────────────────────────────────────────────────────────────────────────────
# PARSING UTILITIES
# ──────────────────────────────────────────────────────────────────────────────

def extract_price(text: str) -> float | None:
    """
    Bulletproof price extractor: Checks for currency symbols and strips all non-numeric characters.
    """
    if not text:
        return None

    lower_text = text.lower()
    # Ensure this string actually contains a price indicator
    if not any(c in lower_text for c in ['৳', 'bdt', 'tk']):
        return None

    # Strip out everything that isn't a digit or a decimal point
    cleaned = re.sub(r"[^\d.]", "", text.replace(",", ""))
    
    if cleaned:
        try:
            return float(cleaned)
        except ValueError:
            pass
            
    return None

def extract_battery_health(text: str) -> int | None:
    """
    Extract a battery health percentage integer from freeform description text.

    Handles patterns like:
      - "Battery Health: 88%"
      - "88% BH"
      - "Battery: 91%"
      - "85% battery health"
    Returns an int (0-100) or None if not found.
    """
    if not text:
        return None

    # Pattern covers "88%", "88 %", "88% BH", "BH: 88", "battery health 88"
    patterns = [
        r"battery\s*health[:\s]+(\d{2,3})\s*%?",  # "Battery Health: 88"
        r"(\d{2,3})\s*%\s*(?:battery|bh)\b",       # "88% Battery" or "88% BH"
        r"\bbh[:\s]+(\d{2,3})",                     # "BH: 88"
        r"(\d{2,3})\s*%\s*bh\b",                   # "88% bh"
        r"battery[:\s]+(\d{2,3})\s*%",             # "Battery: 88%"
    ]
    lower = text.lower()
    for pattern in patterns:
        m = re.search(pattern, lower)
        if m:
            value = int(m.group(1))
            if 0 <= value <= 100:
                return value
    return None


def extract_physical_condition(text: str) -> str | None:
    """
    Identify the physical condition grade from listing text or badge labels.

    SWAP uses tiered condition vocabulary. We match from most to least specific
    to avoid "Fair" accidentally matching "Fairly good condition".
    Returns the canonical condition string or None.
    """
    if not text:
        return None

    lower = text.lower()
    # Ordered from most restrictive match to most lenient.
    condition_map = [
        ("like new",    "Like New"),
        ("mint",        "Mint"),
        ("excellent",   "Excellent"),
        ("very good",   "Very Good"),
        ("good",        "Good"),
        ("fair",        "Fair"),
        ("poor",        "Poor"),
    ]
    for keyword, label in condition_map:
        if keyword in lower:
            return label
    return None


def extract_warranty_status(text: str) -> str | None:
    """
    Identify warranty type from product description text.

    Common SWAP warranty strings: "Official Warranty", "Shop Warranty",
    "No Warranty", "Seller Warranty".  Returns a normalised label or None.
    """
    if not text:
        return None

    lower = text.lower()
    if "official" in lower and "warranty" in lower:
        return "Official"
    if "shop" in lower and "warranty" in lower:
        return "Shop Warranty"
    if "seller" in lower and "warranty" in lower:
        return "Seller Warranty"
    if any(phrase in lower for phrase in ("no warranty", "without warranty", "no warr")):
        return "None"
    if "warranty" in lower:
        return "Warranty (unspecified)"
    return None


def extract_includes_box(text: str) -> bool | None:
    """
    Determine whether the listing includes the original box.

    Looks for positive indicators ("with box", "original box included") and
    negative indicators ("no box", "without box").  Returns True, False, or
    None if the listing is silent on the matter.
    """
    if not text:
        return None

    lower = text.lower()
    positive = ("with box", "original box", "box included", "comes with box", "full box")
    negative = ("no box", "without box", "box not included", "no original box")

    # Check negatives FIRST — "No box included" contains "box included",
    # so a positive-first scan would give a false True.
    if any(n in lower for n in negative):
        return False
    if any(p in lower for p in positive):
        return True
    return None  # Information not present — do not assume.



def map_swap_condition(raw_text: str) -> str | None:
    """
    Map SWAP's exact scratch terminology to standard marketplace conditions.
    """
    if not raw_text:
        return None
        
    text = raw_text.lower()
    
    if "no scratch" in text:
        return "Excellent"
    if "minor scratch" in text:
        return "Good"
    if "moderate scratch" in text or "dent" in text:
        return "Scratched"
        
    return raw_text.strip()

    
# ──────────────────────────────────────────────────────────────────────────────
# DETAIL PAGE SCRAPER
# ──────────────────────────────────────────────────────────────────────────────

def scrape_detail_page(driver: uc.Chrome, url: str) -> list[dict]:
    """
    Navigate to a product page, wait for Next.js hydration, and extract
    ALL available units as separate database records.
    """
    time.sleep(random.uniform(*DETAIL_DELAY_RANGE))
    driver.get(url)

    if handle_surprise_cloudflare(driver):
        log.info("🔄  Re-loading detail page after Cloudflare clear: %s", url)
        driver.get(url)
        time.sleep(3)

    try:
        WebDriverWait(driver, 6).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".product-details-top, .product-info, .different-unit"))
        )
    except Exception:
        log.warning("  ⚠️  Timeout: Product data never rendered.")

    soup = BeautifulSoup(driver.page_source, "html.parser")

    # ── 1. Global Product Data ────────────────────────────────────────────────
    product_name = None
    top_block = soup.find("div", class_=re.compile(r"product-details-top", re.I))
    if top_block:
        strings = list(top_block.stripped_strings)
        if strings:
            product_name = strings[0]

    includes_box = None
    box_label = soup.find(string=re.compile(r"^Box$", re.I))
    if box_label:
        parent_row = box_label.find_parent(['tr', 'div', 'li'])
        if parent_row:
            includes_box = extract_includes_box(parent_row.get_text(separator=" ", strip=True))

    # Targeted Battery Health hunt
    battery_health = None
    bh_label = soup.find(string=re.compile(r"Battery(?:\s*Health)?", re.I))
    if bh_label:
        parent_row = bh_label.find_parent(['tr', 'div', 'li'])
        if parent_row:
            m = re.search(r"(\d{2,3})\s*%", parent_row.get_text(" ", strip=True))
            if m: 
                battery_health = int(m.group(1))
                
    if not battery_health:
        battery_health = extract_battery_health(soup.get_text(separator=" ", strip=True))

    # ── 2. Detect & Parse Individual Units ────────────────────────────────────
    records = []
    choose_buttons = soup.find_all(string=re.compile(r"^Choose Item$", re.I))
    unit_cards = []
    
    for btn in choose_buttons:
        parent = btn.find_parent()
        for _ in range(6):
            if parent and parent.get_text(separator=" ").find("Scratches:") != -1:
                if parent not in unit_cards:
                    unit_cards.append(parent)
                break
            if parent:
                parent = parent.find_parent()

    if unit_cards:
        # ── PATH A: Multiple Units Found ──
        for card in unit_cards:
            # Join with PIPES so fields don't bleed into each other
            card_text = card.get_text(separator=" | ", strip=True)
            
            price = None
            for s in card.stripped_strings:
                extracted = extract_price(s)
                if extracted:
                    price = extracted
                    break
            
            physical_condition = None
            scratch_match = re.search(r"Scratches:\s*([^|]+)", card_text, re.I)
            if scratch_match:
                physical_condition = map_swap_condition(scratch_match.group(1).strip())
                
            warranty_status = None
            warr_match = re.search(r"Warranty Status:\s*([^|]+)", card_text, re.I)
            if warr_match:
                warranty_status = extract_warranty_status(warr_match.group(1).strip())
                
            records.append({
                "product_name":       product_name,
                "original_link":      url, 
                "price":              price,
                "physical_condition": physical_condition,
                "battery_health":     battery_health,
                "warranty_status":    warranty_status,
                "includes_box":       includes_box,
                "source_platform":    SOURCE_PLATFORM,
                "scraped_at":         datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            })
            
    else:
        # ── PATH B: Single Unit Fallback ──
        price = None
        if top_block:
            for s in top_block.stripped_strings:
                extracted = extract_price(s)
                if extracted:
                    price = extracted
                    break
        
        physical_condition = None
        grade_label = soup.find(string=re.compile(r"Product Grade", re.I))
        if grade_label:
            parent_row = grade_label.find_parent(['tr', 'div', 'li'])
            if parent_row:
                raw_grade = parent_row.get_text(separator=" ", strip=True)
                physical_condition = re.sub(r"(?i)Product\s*Grade[:\|]?\s*", "", raw_grade).strip()
        
        if not physical_condition:
            scratches_label = soup.find(string=re.compile(r"^Scratches$", re.I))
            if scratches_label:
                parent_row = scratches_label.find_parent(['tr', 'div', 'li'])
                if parent_row:
                    raw_scratches = parent_row.get_text(separator=" ", strip=True)
                    val = re.sub(r"(?i)Scratches[:\|]?\s*", "", raw_scratches).strip()
                    physical_condition = map_swap_condition(val)
                    
        warranty_status = None
        warranty_label = soup.find(string=re.compile(r"Warranty Status", re.I))
        if warranty_label:
            parent_row = warranty_label.find_parent(['tr', 'div', 'li'])
            if parent_row:
                warranty_status = extract_warranty_status(parent_row.get_text(separator=" ", strip=True))

        records.append({
            "product_name":       product_name,
            "original_link":      url,
            "price":              price,
            "physical_condition": physical_condition,
            "battery_health":     battery_health,
            "warranty_status":    warranty_status,
            "includes_box":       includes_box,
            "source_platform":    SOURCE_PLATFORM,
            "scraped_at":         datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        })

    for r in records:
        log.info(
            "  ✔  %s | ৳%s | Cond: %s | Box: %s | Warr: %s | Batt: %s",
            (r["product_name"] or "Unknown")[:18],
            r["price"],
            (r["physical_condition"] or "?")[:10],
            "Yes" if r["includes_box"] else "No" if r["includes_box"] is False else "?",
            (r["warranty_status"] or "?")[:10],
            f"{r['battery_health']}%" if r["battery_health"] else "?"
        )

    return records


# ──────────────────────────────────────────────────────────────────────────────
# JSONL WRITER
# ──────────────────────────────────────────────────────────────────────────────

def append_record(filepath: Path, record: dict) -> None:
    """
    Append a single product record to the JSONL output file.

    Each call opens, writes one line, and closes the file handle — this is
    intentionally crash-proof: even if the process is killed between two
    iterations, every previously written line is fully flushed to disk.

    Args:
        filepath: Path to the .jsonl file.
        record:   Dict representing one scraped product.
    """
    with open(filepath, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, ensure_ascii=False) + "\n")


# ──────────────────────────────────────────────────────────────────────────────
# LISTING PAGE SCRAPER
# ──────────────────────────────────────────────────────────────────────────────

def scrape_listing_page(driver: uc.Chrome, page_num: int) -> list[str]:
    """
    Load one collection listing page and return all product detail URLs found.

    The function is intentionally decoupled from the detail-scraping logic so
    each layer can fail independently without losing the other's progress.

    Args:
        driver:   Active ChromeDriver session.
        page_num: 1-based page number to append as a query parameter.

    Returns:
        List of absolute product URLs found on this page, possibly empty.
    """
    # SWAP paginates with a `page` query parameter.
    url = f"{BASE_COLLECTION_URL}&page={page_num}"
    log.info("\n── Page %d ─────────────────────────────────────────", page_num)
    log.info("  Fetching: %s", url)

    driver.get(url)

    # Cloudflare checkpoint guard for list pages.
    if handle_surprise_cloudflare(driver):
        log.info("🔄  Re-loading listing page after Cloudflare clear.")
        driver.get(url)
        time.sleep(3)

    # Human-like pause before parsing — lets JS-rendered content fully settle.
    time.sleep(random.uniform(*PAGE_DELAY_RANGE))

    soup = BeautifulSoup(driver.page_source, "html.parser")

    # ── Find product cards ────────────────────────────────────────────────────
    # SWAP uses a CSS grid of product cards. Each card is an <a> tag (or wraps
    # one) linking directly to the product detail page.
    #
    # Selector strategy (ordered by specificity, first match wins):
    #   1. <a> tags whose href contains "/buy/" — the canonical product URL pattern.
    #   2. Any element with a class hinting at "product-card" or "item".
    #
    # We collect hrefs, then deduplicate while preserving order.

    product_links = []
    seen = set()

    # Primary: direct anchor tags pointing at product detail pages.
    for tag in soup.find_all("a", href=re.compile(r"/buy/", re.I)):
        href = tag.get("href", "").strip()
        if not href:
            continue
        # Normalise to an absolute URL.
        if href.startswith("/"):
            href = "https://swap.com.bd" + href
        # Exclude the collection list URL itself to avoid self-loops.
        if "collection-list" in href:
            continue
        if href not in seen:
            seen.add(href)
            product_links.append(href)

    log.info("  Found %d product links on page %d.", len(product_links), page_num)
    return product_links


# ──────────────────────────────────────────────────────────────────────────────
# BROWSER SETUP
# ──────────────────────────────────────────────────────────────────────────────

def build_driver() -> uc.Chrome:
    """
    Initialise an Undetected ChromeDriver instance with Apple Silicon specific fixes.
    """
    options = uc.ChromeOptions()
    
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1440,900")
    options.add_argument("--disable-blink-features=AutomationControlled")
    
    # 🍏 Emulate a native Mac Chrome environment cleanly
    options.add_argument("--lang=en-US,en;q=0.9")
    options.add_argument("--platform=MacIntel")

    options.page_load_strategy = "eager"

    driver = uc.Chrome(
        options=options, 
        version_main=149, 
        use_subprocess=True 
    )
    
    return driver

# ──────────────────────────────────────────────────────────────────────────────
# MAIN ORCHESTRATOR
# ──────────────────────────────────────────────────────────────────────────────

def scrape_swap() -> None:
    """
    Main entry point: orchestrates the full scrape from listing pages → detail
    pages → JSONL output.

    Flow:
      1. Boot the browser and warm up on the target domain (clears any initial
         Cloudflare Turnstile before the timed scraping loop starts).
      2. Iterate through collection pages, collecting product detail URLs.
      3. For each URL, scrape the detail page and immediately write the record.
      4. Stop early if a listing page returns zero products (end of catalogue).
    """
    log.info("=" * 60)
    log.info("SWAP.com.bd Scraper  —  target: %s", BASE_COLLECTION_URL)
    log.info("Output file: %s", OUTPUT_FILE.resolve())
    log.info("=" * 60)

    driver = build_driver()

    try:
        # ── Warm-up: Load the homepage first to clear any Turnstile on the root
        # domain before we start navigating collection pages with a timer running.
        # ── Warm-up: Load the homepage first
        # ── Direct Load: Head straight to your target collection page
        log.info("🌐  Navigating directly to target collection...")
        driver.get(BASE_COLLECTION_URL)
        
        # Give the elements 4 seconds to settle down completely
        time.sleep(4) 
        
        handle_surprise_cloudflare(driver)
        log.info("✅  Target page ready. Starting page collection scrape...")

        total_scraped = 0

        for page_num in range(1, MAX_PAGES + 1):

            # ── Step 1: Get product URLs from the listing page ─────────────
            product_urls = scrape_listing_page(driver, page_num)

            # An empty listing page signals we've passed the last page.
            if not product_urls:
                log.info("🏁  No products found on page %d — end of catalogue.", page_num)
                break

            # ── Step 2: Scrape each product detail page ────────────────────
            # ── Step 2: Scrape each product detail page ────────────────────
            for url in product_urls:
                try:
                    # 'records' is now a list, which might contain 1 unit or 5 units
                    records = scrape_detail_page(driver, url)
                    
                    # Append each unit to the JSONL file as a separate line
                    for record in records:
                        append_record(OUTPUT_FILE, record)
                        
                    total_scraped += len(records)
                    
                except Exception as exc:
                    log.error("  ✘  Failed to scrape %s: %s", url, exc)
                    append_record(OUTPUT_FILE, {
                        "product_name":       None,
                        "original_link":      url,
                        "price":              None,
                        "physical_condition": None,
                        "battery_health":     None,
                        "warranty_status":    None,
                        "includes_box":       None,
                        "source_platform":    SOURCE_PLATFORM,
                        "scraped_at":         datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                        "_error":             str(exc),
                    })
                    
        log.info("\n" + "=" * 60)
        log.info("✅  Scrape complete.  Total records written: %d", total_scraped)
        log.info("📄  Output: %s", OUTPUT_FILE.resolve())
        log.info("=" * 60)

    finally:
        # Always quit the driver — even on keyboard interrupt or uncaught error —
        # to free the Chrome process and its temp profile directory.
        driver.quit()
        log.info("🔒  Browser closed.")


# ──────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    scrape_swap()