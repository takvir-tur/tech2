"""
nexthand_scraper.py  v2
=======================
Fixed version addressing the root causes of "No price elements found":

ROOT CAUSE 1 — XPath `contains(text(), '৳')` vs `contains(., '৳')`
  NextHand renders prices as nested spans:
    <div class="price-wrapper">
      <span class="symbol">৳</span>
      <span class="amount">42,499</span>
    </div>
  The parent div has NO direct text node containing ৳ — only its children do.
  `text()` in XPath only matches direct text nodes; `.` matches the full subtree.
  FIX: Use `contains(., '৳')` + a tight CSS class selector to avoid matching the whole page.

ROOT CAUSE 2 — BeautifulSoup find_all(string=...) searches TEXT NODES only
  `soup.find_all(string=re.compile(r'৳'))` finds NavigableString nodes, not elements.
  A <div>৳42,499</div> works, but <div><span>৳</span><span>42,499</span></div> → nothing.
  FIX: Walk the DOM by element class patterns instead of text-node searches.

ROOT CAUSE 3 — Card boundary detection was too fragile
  Walking 8 levels up from a price node to find "battery" in ancestor text is brittle
  when the price symbol and amount are split across sibling spans.
  FIX: Find card containers directly by CSS class patterns, then extract fields from
  each card's full subtree text. Much more robust.

ROOT CAUSE 4 — wait_for_unit_cards XPath also used contains(text(), '৳')
  Same bug — if ৳ lives in a child span, the XPath never matches and we timeout.
  FIX: Use contains(., '৳') with a narrower ancestor selector.
"""

import json
import re
import time
import random
import logging
from datetime import datetime, timezone
from pathlib import Path

import undetected_chromedriver as uc
from bs4 import BeautifulSoup, Tag
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException


# ──────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ──────────────────────────────────────────────────────────────────────────────

BRAND_URL    = "https://www.nexthand.com/brand/apple"
OUTPUT_FILE  = Path("nexthand_inventory.jsonl")
MAX_PAGES    = 30
PAGE_DELAY_RANGE   = (2.5, 5.0)
DETAIL_DELAY_RANGE = (2.0, 4.5)
CF_WAIT_SECONDS    = 30
SPA_TIMEOUT        = 25   # bumped from 20 — give Nuxt hydration more breathing room
SOURCE_PLATFORM    = "NextHand"
CHROME_VERSION     = 149   # match your local Chrome: google-chrome --version

# ──────────────────────────────────────────────────────────────────────────────
# LOGGING
# ──────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("nexthand_scraper")


# ──────────────────────────────────────────────────────────────────────────────
# BROWSER SETUP
# ──────────────────────────────────────────────────────────────────────────────

def build_driver() -> uc.Chrome:
    """
    Apple Silicon stable ChromeDriver.
    use_subprocess=True is mandatory on M-series Macs to prevent fork-bomb crashes.
    page_load_strategy=eager fires as soon as the DOM is interactive, before
    all network assets finish — Nuxt hydration still needs WebDriverWait after this.
    """
    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1366,900")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.page_load_strategy = "eager"

    return uc.Chrome(
        options=options,
        version_main=CHROME_VERSION,
        use_subprocess=True,      # required for Apple Silicon stability
    )


# ──────────────────────────────────────────────────────────────────────────────
# ANTI-BOT DEFENSE
# ──────────────────────────────────────────────────────────────────────────────

def handle_surprise_cloudflare(driver: uc.Chrome) -> bool:
    """
    Detect Cloudflare Turnstile and wait/auto-click through it.
    Uses try/except around driver.title as specified — safe for mid-navigation calls.
    """
    cf_indicators = ("Just a moment", "Security Check", "Cloudflare",
                     "Attention Required", "DDoS-Guard")
    try:
        title = driver.title
    except WebDriverException:
        return False

    if not any(s in title for s in cf_indicators):
        return False

    log.warning("🚨  CLOUDFLARE CHALLENGE (title: '%s')", title)
    log.info("⏳  Waiting %ds for Turnstile auto-solve...", CF_WAIT_SECONDS)
    time.sleep(CF_WAIT_SECONDS)

    try:
        btn = WebDriverWait(driver, 6).until(EC.element_to_be_clickable((
            By.XPATH,
            "//button[contains(., 'Continue')] | //button[contains(., 'Verify')] | //input[@type='submit']"
        )))
        driver.execute_script("arguments[0].click();", btn)
        time.sleep(5)
    except Exception:
        pass

    try:
        title_after = driver.title
    except WebDriverException:
        title_after = ""

    if any(s in title_after for s in cf_indicators):
        log.warning("🛑  Auto-bypass failed — HUMAN INTERVENTION needed in Chrome window.")
        while True:
            time.sleep(2)
            try:
                t = driver.title
            except WebDriverException:
                continue
            if not any(s in t for s in cf_indicators):
                break

    log.info("✅  Cloudflare cleared.")
    time.sleep(2)
    return True


# ──────────────────────────────────────────────────────────────────────────────
# SPA HYDRATION WAITERS
# ──────────────────────────────────────────────────────────────────────────────

def wait_for_nuxt(driver: uc.Chrome) -> None:
    """Wait for Nuxt's root mount point before any parsing attempt."""
    try:
        WebDriverWait(driver, SPA_TIMEOUT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div#__nuxt"))
        )
    except TimeoutException:
        log.warning("⚠️   Timed out waiting for #__nuxt. Proceeding anyway.")


def wait_for_product_grid(driver: uc.Chrome) -> bool:
    """
    Listing page: wait for at least one /product/ link to appear.
    Returns False on timeout (signals end of catalogue to caller).
    """
    try:
        WebDriverWait(driver, SPA_TIMEOUT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "a[href*='/product/']"))
        )
        return True
    except TimeoutException:
        return False


def wait_for_unit_cards(driver: uc.Chrome) -> bool:
    """
    Detail page: Wait specifically for NextHand's unique price elements to render.
    """
    try:
        WebDriverWait(driver, SPA_TIMEOUT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".price-number"))
        )
        return True
    except TimeoutException:
        log.warning("⚠️   Unit cards timed out — no '.price-number' found.")
        return False

# ──────────────────────────────────────────────────────────────────────────────
# DEBUG HELPER  (set DEBUG=True to dump raw HTML on failure)
# ──────────────────────────────────────────────────────────────────────────────

DEBUG = False

def dump_html(driver: uc.Chrome, label: str) -> None:
    if not DEBUG:
        return
    path = Path(f"debug_{label}_{int(time.time())}.html")
    path.write_text(driver.page_source, encoding="utf-8")
    log.info("🐛  Dumped HTML → %s", path)


# ──────────────────────────────────────────────────────────────────────────────
# CARD CONTAINER DETECTION
# ──────────────────────────────────────────────────────────────────────────────

# Class-name fragments we expect to appear on NextHand's unit card containers.
# These are intentionally broad — a card wrapper only needs ONE of these to match.
CARD_CLASS_HINTS = re.compile(
    r"card|item|unit|listing|product[\-_]?card|match|tile|result",
    re.I,
)

def find_unit_card_containers(soup: BeautifulSoup) -> list[Tag]:
    """
    Locate the repeating card elements in the 'Pick Your Perfect Match' grid.

    Strategy (three passes, stops as soon as we find something useful):

    Pass 1 — Anchor to the section header, then find sibling/descendant cards.
      NextHand renders a heading like "Pick Your Perfect Match". We find it,
      walk to its nearest section-level ancestor, then search for card-like
      children whose text contains both a price (৳) and a spec ('Battery').

    Pass 2 — Full-page class-name scan.
      Find all elements matching CARD_CLASS_HINTS that contain both ৳ and battery.

    Pass 3 — Price-element grouping (last resort).
      Find all elements whose DIRECT subtree contains ৳, de-duplicate by common
      ancestor, and use those ancestors as card proxies.
    """

    # ── Pass 1: anchor on section heading ────────────────────────────────────
    section_root = None
    for heading_text in ("Pick Your Perfect Match", "Perfect Match", "Available Units"):
        node = soup.find(string=re.compile(heading_text, re.I))
        if node:
            # Walk up until we hit a block-level container.
            el = node.parent
            for _ in range(6):
                if el and el.name in ("section", "div", "main", "article"):
                    section_root = el
                    break
                if el:
                    el = el.parent
            break

    search_root = section_root or soup

    # Helper: does this element look like a single unit card?
    def is_card_candidate(el: Tag) -> bool:
        if not isinstance(el, Tag):
            return False
        text = el.get_text()
        return "৳" in text and (
            "battery" in text.lower() or "comes with" in text.lower()
        )

    # ── Pass 1 result ─────────────────────────────────────────────────────────
    # Walk direct children of the section root looking for card wrappers.
    candidates_p1 = []
    if section_root:
        for child in section_root.children:
            if isinstance(child, Tag) and is_card_candidate(child):
                candidates_p1.append(child)
        # One level deeper if none found at direct child level.
        if not candidates_p1:
            for child in section_root.find_all(True, recursive=False):
                for grandchild in child.find_all(True, recursive=False):
                    if is_card_candidate(grandchild):
                        candidates_p1.append(grandchild)

    if candidates_p1:
        log.info("  🃏  Found %d unit cards (Pass 1 — section anchor).", len(candidates_p1))
        return candidates_p1

    # ── Pass 2: class-name scan across full page ──────────────────────────────
    candidates_p2 = [
        el for el in search_root.find_all(class_=CARD_CLASS_HINTS)
        if is_card_candidate(el)
    ]

    # De-duplicate: if one card is an ancestor of another, keep only the innermost.
    def dedup_by_nesting(elements: list[Tag]) -> list[Tag]:
        result = []
        for el in elements:
            dominated = any(
                other is not el and other in el.descendants
                for other in elements
            )
            if not dominated:
                result.append(el)
        return result

    candidates_p2 = dedup_by_nesting(candidates_p2)

    if candidates_p2:
        log.info("  🃏  Found %d unit cards (Pass 2 — class scan).", len(candidates_p2))
        return candidates_p2

    # ── Pass 3: price-element grouping ────────────────────────────────────────
    # Find every element whose subtree text contains ৳, then group by the
    # smallest ancestor that also contains battery/spec text.
    price_els = [
        el for el in search_root.find_all(True)
        if "৳" in el.get_text() and len(el.get_text()) < 200  # small = leaf-ish
    ]

    card_proxies: dict[int, Tag] = {}
    for el in price_els:
        proxy = el
        for _ in range(8):
            parent = proxy.parent
            if parent is None or parent.name in ("body", "html", "[document]"):
                break
            parent_text = parent.get_text()
            if "battery" in parent_text.lower() or "comes with" in parent_text.lower():
                proxy = parent
                break
            proxy = parent

        card_proxies[id(proxy)] = proxy

    candidates_p3 = list(card_proxies.values())

    if candidates_p3:
        log.info("  🃏  Found %d unit cards (Pass 3 — price grouping).", len(candidates_p3))
        return candidates_p3

    log.warning("  ⚠️   All three card-detection passes failed.")
    return []


# ──────────────────────────────────────────────────────────────────────────────
# FIELD EXTRACTORS
# ──────────────────────────────────────────────────────────────────────────────

def extract_price(text: str) -> float | None:
    """
    Parse a BDT price string to float.
    Handles: "৳42,499", "৳ 42,499", nested span output "৳ | 42,499".
    """
    if not text:
        return None
    # Remove taka sign, commas, spaces, pipe separators
    cleaned = re.sub(r"[৳,\s|]", "", text)
    m = re.search(r"\d+(?:\.\d+)?", cleaned)
    return float(m.group()) if m else None


def extract_battery_health(card_text: str) -> int | None:
    """
    Extract battery health integer from card text blob.
    Handles separator-joined text: "Battery Health | : | 85" or "Battery Health: 85".
    """
    if not card_text:
        return None
    # Collapse any pipe/whitespace runs so "Battery Health | : | 85" → "Battery Health:85"
    normalised = re.sub(r"[\s|]+", " ", card_text).strip()
    patterns = [
        r"battery\s*health\s*:?\s*(\d{2,3})\s*%?",
        r"\bbh\s*:?\s*(\d{2,3})\s*%?",
        r"(\d{2,3})\s*%\s*(?:battery|bh)\b",
    ]
    lower = normalised.lower()
    for pattern in patterns:
        m = re.search(pattern, lower)
        if m:
            val = int(m.group(1))
            if 0 <= val <= 100:
                return val
    return None


def extract_price_from_card(card: Tag) -> float | None:
    """
    Extract price directly from the card's DOM — more reliable than regex on full text.

    FIX v2: Instead of searching text nodes for ৳, we find elements whose
    subtree contains ৳ and are small (leaf-ish), then grab ALL text from that
    subtree. This handles the split-span pattern:
      <span>৳</span><span>42,499</span>  →  subtree text = "৳42,499"
    """
    # Find the smallest element containing ৳
    taka_el = None
    for el in card.find_all(True):
        txt = el.get_text()
        if "৳" in txt and len(txt) < 80:   # 80 chars = price el, not full card
            taka_el = el
            break   # find_all returns in document order — first = deepest match

    if taka_el is None:
        return None

    # Get the full subtree text of this element (captures both sibling spans)
    raw = taka_el.get_text(separator="", strip=True)
    return extract_price(raw)


def extract_condition(card: Tag) -> str | None:
    """
    Extract physical condition badge.

    NextHand renders condition as a coloured pill/badge — typically a <span>
    or <div> with a very short text value ("Excellent", "Good", etc.) near the
    top of the card. We scan short text nodes and match against known vocabulary.
    """
    known = ("Like New", "Mint", "Excellent", "Very Good", "Good", "Fair", "Poor")

    # Pass 1: look for badge-like elements by class name.
    badge_hint = re.compile(r"badge|condition|tag|label|grade|status|chip", re.I)
    for el in card.find_all(class_=badge_hint):
        text = el.get_text(strip=True)
        for cond in known:
            if cond.lower() == text.lower():
                return cond

    # Pass 2: scan all short text nodes.
    for el in card.find_all(True):
        text = el.get_text(strip=True)
        if 2 <= len(text) <= 25:
            for cond in known:
                if cond.lower() == text.lower():
                    return cond

    # Pass 3: substring scan on full card text (weakest — may false-positive).
    card_text = card.get_text(separator=" ", strip=True).lower()
    for cond in known:
        if cond.lower() in card_text:
            return cond

    return None


def extract_includes_box(card_text: str) -> bool:
    """
    Check for 'Original Box' in the "Comes with:" section.
    Returns True/False — never None (absence = no box).
    """
    return "original box" in card_text.lower()


def extract_warranty(card_text: str) -> str | None:
    lower = card_text.lower()
    if "official warranty" in lower:   return "Official"
    if "shop warranty"    in lower:    return "Shop Warranty"
    if "seller warranty"  in lower:    return "Seller Warranty"
    if "no warranty"      in lower or \
       "without warranty" in lower:    return "None"
    if "warranty"         in lower:    return "Warranty (unspecified)"
    return None


# ──────────────────────────────────────────────────────────────────────────────
# JSONL WRITER
# ──────────────────────────────────────────────────────────────────────────────

def append_record(filepath: Path, record: dict) -> None:
    """Open, write one line, close — crash-proof per-record flush."""
    with open(filepath, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, ensure_ascii=False) + "\n")


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


# ──────────────────────────────────────────────────────────────────────────────
# DETAIL PAGE SCRAPER
# ──────────────────────────────────────────────────────────────────────────────

def scrape_detail_page(driver: uc.Chrome, url: str) -> list[dict]:
    """
    Load one product detail page and return one dict per physical unit card
    by explicitly targeting NextHand's semantic CSS classes.
    """
    time.sleep(random.uniform(*DETAIL_DELAY_RANGE))
    log.info("  → %s", url)

    driver.get(url)

    if handle_surprise_cloudflare(driver):
        log.info("🔄  Re-loading detail page after Cloudflare clear: %s", url)
        driver.get(url)
        time.sleep(3)

    wait_for_nuxt(driver)
    cards_ready = wait_for_unit_cards(driver)

    if not cards_ready:
        log.warning("  ⚠️   Unit grid did not appear at %s", url)
        return []

    # Extra settle time for Vue elements to fully populate
    time.sleep(random.uniform(1.5, 2.5))

    soup = BeautifulSoup(driver.page_source, "html.parser")

    # ── 1. Global Product Name ───────────────────────────────────────────────
    product_name = None
    h1 = soup.find("h1")
    if h1:
        product_name = h1.get_text(strip=True)
    if not product_name:
        title_tag = soup.find("title")
        if title_tag:
            product_name = re.sub(
                r"\s*[|\-]\s*nexthand.*$", "",
                title_tag.get_text(strip=True), flags=re.I
            ).strip()

    # ── 2. Isolate Unit Cards ────────────────────────────────────────────────
    records = []
    unit_cards = []
    
    # NextHand stores the unit prices in a specific 'price-number' class 
    # (Notice this ignores the "You may also like" section which uses 'price' instead)
    price_nodes = soup.find_all(class_="price-number")
    
    for p_node in price_nodes:
        # Climb up from the price to find the exact card container
        card = p_node.find_parent("div", class_=re.compile(r"\bcard\b"))
        if card and card not in unit_cards:
            unit_cards.append(card)

    if not unit_cards:
        log.warning("  ⚠️  Failed to isolate unit cards from .price-number elements.")
        return []

    # ── 3. Extract Data from Cards ───────────────────────────────────────────
    for card in unit_cards:
        # Flatten the card into a pipe-separated string (prevents Nuxt squashing)
        card_text = card.get_text(" | ", strip=True)
        
        # 1. Price
        price = None
        price_node = card.find(class_="price-number")
        if price_node:
            price_str = price_node.get_text(strip=True)
            # Remove the taka sign and any commas
            cleaned = re.sub(r"[^\d.]", "", price_str.replace(",", ""))
            if cleaned:
                try:
                    price = float(cleaned)
                except ValueError:
                    pass
        
        # 2. Condition
        cond = None
        badge = card.find(class_="badge")
        if badge:
            cond = badge.get_text(strip=True)
            
        # 3. Battery Health
        batt = None
        # 💥 FIX: [\s:|]* handles "Battery Health: 85", "Battery Health | 85", or "Battery Health: | 85"
        batt_match = re.search(r"Battery\s*Health[\s:|]*(\d{2,3})", card_text, re.I)
        if batt_match:
            batt = int(batt_match.group(1))
            
        # 4. Box Inclusion
        includes_box = "original box" in card_text.lower()
        
        # 5. Warranty Status (NextHand rarely lists this on the unit card itself)
        warranty = None
        lower_text = card_text.lower()
        if "official warranty" in lower_text: warranty = "Official"
        elif "shop warranty" in lower_text: warranty = "Shop Warranty"

        # 6. Storage (RAM / ROM)
        storage = None
        # This handles "Storage: 128GB", "Storage | 128GB", or "RAM/ROM: 8GB/128GB"
        storage_match = re.search(r"(?:Storage|RAM\s*/\s*ROM)[\s:|]+([^|]+)", card_text, re.I)
        if storage_match:
            storage = storage_match.group(1).strip()

        record = {
            "product_name":       product_name,
            "original_link":      url,
            "price":              price,
            "physical_condition": cond,
            "battery_health":     batt,
            "storage":            storage,
            "warranty_status":    warranty,
            "includes_box":       includes_box,
            "source_platform":    SOURCE_PLATFORM,
            "scraped_at":         datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        }
        records.append(record)
        
        log.info(
            "    ✔  ৳%s | %s | 🔋%s%% | 💾 %s | box=%s",
            price, cond or "?", batt or "?", storage or "?", includes_box
        )

    return records
    

# ──────────────────────────────────────────────────────────────────────────────
# LISTING PAGE SCRAPER
# ──────────────────────────────────────────────────────────────────────────────

def scrape_listing_pages(driver: uc.Chrome, max_pages: int = 2) -> list[str]:
    """
    Loads the brand page ONCE and navigates through the pagination bar.
    Hard-capped to max_pages (default 2) and auto-stops if no new links are found.
    """
    log.info("\n── Mapping full catalogue (Bypassing URL Pagination) ────────")
    driver.get(BRAND_URL)

    if handle_surprise_cloudflare(driver):
        driver.get(BRAND_URL)
        time.sleep(3)

    time.sleep(4) # Give the initial grid time to load

    seen_links = set()
    ordered_links = []
    current_page = 1
    consecutive_fails = 0

    while True:
        # 💥 1. Hard cap check: Stop if we've exceeded the max pages
        if current_page > max_pages:
            log.info("🏁  Reached page limit (%d). Stopping map.", max_pages)
            break

        # Scroll down so the pagination bar is fully in view
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight - 300);")
        time.sleep(3) 

        soup = BeautifulSoup(driver.page_source, "html.parser")

        # 2. Harvest Links on Current View
        current_count = len(seen_links)
        for tag in soup.find_all("a", href=re.compile(r"/product/", re.I)):
            href = tag.get("href", "").strip()
            if not href: continue
            if href.startswith("/"): href = "https://www.nexthand.com" + href
            if href not in seen_links:
                seen_links.add(href)
                ordered_links.append(href)

        new_links = len(seen_links) - current_count
        log.info("  Found %d new links on Page %d (Total mapped: %d)", new_links, current_page, len(seen_links))

        # 💥 2. Fail-safe: Break out if we keep finding 0 new links
        if new_links == 0:
            consecutive_fails += 1
            if consecutive_fails >= 2:
                log.info("🏁  No new links found twice in a row. End of catalogue.")
                break
        else:
            consecutive_fails = 0

        # If we are currently on the max page, don't bother clicking next
        if current_page == max_pages:
            log.info("🏁  Mapped requested %d pages. Moving to extraction.", max_pages)
            break

        next_page_num = current_page + 1
        clicked_next = False

        # 3. Strategy A: Tag-Agnostic Number Hunt
        try:
            next_num_xpath = (
                f"//ul//*[normalize-space(text())='{next_page_num}'] | "
                f"//nav//*[normalize-space(text())='{next_page_num}']"
            )
            next_num_btn = driver.find_element(By.XPATH, next_num_xpath)
            
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", next_num_btn)
            time.sleep(1)
            driver.execute_script("arguments[0].click();", next_num_btn)
            
            log.info("  ➡ Clicked Page %d...", next_page_num)
            clicked_next = True
            
        except Exception:
            pass

        # 4. Strategy B: Tag-Agnostic Arrow Hunt
        if not clicked_next:
            try:
                arrow_xpath = (
                    "//ul//*[contains(text(), '>') or contains(text(), '›') or contains(translate(text(), 'NEXT', 'next'), 'next')] | "
                    "//nav//*[contains(text(), '>') or contains(text(), '›') or contains(translate(text(), 'NEXT', 'next'), 'next')]"
                )
                arrow_btn = driver.find_element(By.XPATH, arrow_xpath)
                
                parent_class = arrow_btn.find_element(By.XPATH, "./..").get_attribute("class").lower()
                btn_class = arrow_btn.get_attribute("class").lower()
                if "disabled" in parent_class or "disabled" in btn_class or arrow_btn.get_attribute("disabled"):
                    log.info("🏁  'Next' arrow is disabled. Reached the last page.")
                    break
                    
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", arrow_btn)
                time.sleep(1)
                driver.execute_script("arguments[0].click();", arrow_btn)
                
                log.info("  ➡ Clicked 'Next' arrow to reach Page %d...", next_page_num)
                clicked_next = True
                
            except Exception:
                log.info("🏁  No clickable pagination found. End of catalogue.")
                break

        if clicked_next:
            current_page += 1
            time.sleep(4.5) 
        else:
            break

    return ordered_links

    
# ──────────────────────────────────────────────────────────────────────────────
# MAIN ORCHESTRATOR
# ──────────────────────────────────────────────────────────────────────────────

def scrape_nexthand() -> None:
    log.info("=" * 62)
    log.info("NextHand Scraper v2  —  %s", BRAND_URL)
    log.info("Output: %s", OUTPUT_FILE.resolve())
    log.info("=" * 62)

    driver = build_driver()

    try:
        log.info("🌐  Warming up on nexthand.com...")
        driver.get("https://www.nexthand.com")
        handle_surprise_cloudflare(driver)
        wait_for_nuxt(driver)
        time.sleep(4)
        log.info("✅  Warm-up done. Scraping...")

        total_units = total_products = 0

        # 💥 NEW: Get ALL product URLs upfront by driving the pagination UI
        all_product_urls = scrape_listing_pages(driver)

        if not all_product_urls:
            log.warning("🏁  No products found at all.")
            return

        log.info("\n── Scraping %d Product Pages ──────────────────────────────", len(all_product_urls))

        for url in all_product_urls:
            try:
                records = scrape_detail_page(driver, url)
                total_products += 1

                if records:
                    for rec in records:
                        append_record(OUTPUT_FILE, rec)
                        total_units += 1
                else:
                    # Stub so the URL is never silently lost.
                    append_record(OUTPUT_FILE, {
                        "product_name": None, "original_link": url,
                        "price": None, "physical_condition": None,
                        "battery_health": None, "storage": None, "includes_box": None,
                        "warranty_status": None, "source_platform": SOURCE_PLATFORM,
                        "scraped_at": now_utc(), "_note": "no_units_found",
                    })

            except Exception as exc:
                log.error("  ✘  %s: %s", url, exc)
                append_record(OUTPUT_FILE, {
                    "product_name": None, "original_link": url,
                    "price": None, "physical_condition": None,
                    "battery_health": None, "storage": None, "includes_box": None,
                    "warranty_status": None, "source_platform": SOURCE_PLATFORM,
                    "scraped_at": now_utc(), "_error": str(exc),
                })

        log.info("\n" + "=" * 62)
        log.info("✅  Done.  Products: %d  |  Unit records: %d", total_products, total_units)
        log.info("📄  %s", OUTPUT_FILE.resolve())
        log.info("=" * 62)

    finally:
        driver.quit()
        log.info("🔒  Browser closed.")

if __name__ == "__main__":
    scrape_nexthand()