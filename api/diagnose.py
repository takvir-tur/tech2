import time
import re
import undetected_chromedriver as uc
from bs4 import BeautifulSoup

print("Booting pagination diagnostic...")

options = uc.ChromeOptions()
options.add_argument("--window-size=1366,900")
options.page_load_strategy = "eager"

# Use the stable Apple Silicon settings
driver = uc.Chrome(options=options, version_main=149, use_subprocess=True)

try:
    driver.get("https://www.nexthand.com/brand/apple")
    print("Waiting 10 seconds for page to fully load and Cloudflare to clear...")
    time.sleep(10)
    
    print("Scrolling to the absolute bottom...")
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(4)
    
    soup = BeautifulSoup(driver.page_source, "html.parser")
    
    print("\n=== SEARCHING FOR PAGINATION ELEMENTS ===")
    
    # 1. Search for anything with 'pagination', 'next', or 'load' in its class name
    candidates = soup.find_all(class_=re.compile(r"pagin|load|next", re.I))
    
    # 2. Search for any buttons or links containing the word 'Next' or 'Load'
    if not candidates:
        candidates = soup.find_all(["button", "a"], string=re.compile(r"next|load|more|›|»", re.I))
        
    if candidates:
        for i, p in enumerate(candidates[:3]):
            print(f"\n--- CANDIDATE {i+1} ---")
            print(p.prettify())
    else:
        print("\n❌ No obvious pagination buttons found! It might be auto-infinite scroll.")
        
    print("\n=== DOM STRUCTURE AT THE VERY BOTTOM ===")
    # Print the structure of the last few visual elements on the page to see where it ends
    for el in soup.find_all(['div', 'nav', 'ul', 'footer'])[-15:]:
        classes = el.get('class', [])
        if classes:
            print(f"<{el.name} class='{' '.join(classes)}'>")

finally:
    driver.quit()
    print("\nDiagnostic finished.")