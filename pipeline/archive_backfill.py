import os
import json
import re
import time
import requests
from html.parser import HTMLParser
from supabase import create_client
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SECRET_KEY"])
claude = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

HEADERS = {"User-Agent": "Mozilla/5.0 StageGauge/1.0"}

EXTRACT_PROMPT = """You are a theatre review analyst. Read this review text and extract:
1. show_title: the name of the production being reviewed
2. company: the performing company (if mentioned)
3. city: city where the performance took place
4. reviewer: critic's name if present
5. pull_quote: the single most representative sentence (max 25 words)
6. star_rating: numeric rating out of 5 ONLY if explicitly stated (e.g. "4 stars", "★★★★"). Return null if not explicit.
7. confidence: your confidence (0-1) that this is a performing arts review

Return JSON only. No other text."""

# Archive sources with their review index pages
ARCHIVE_SOURCES = [
    {
        "outlet": "Suzy Goes See",
        "index_urls": [
            "https://suzygoessee.com/2026/",
            "https://suzygoessee.com/2025/",
            "https://suzygoessee.com/2024/",
        ],
        "link_pattern": r'href="(https://suzygoessee\.com/20\d\d/\d\d/\d\d/review-[^"]+)"',
        "city": "Sydney",
        "country": "AU",
    },
    {
        "outlet": "Stage Noise",
        "index_urls": [
            "https://stagenoise.com/reviews",
        ],
        "link_pattern": r'href="(https://(?:www\.)?stagenoise\.com/review/20\d\d/[^"]+)"',
        "city": "Sydney",
        "country": "AU",
    },
    {
        "outlet": "Australian Arts Review",
        "index_urls": [
            "https://artsreview.com.au/category/theatre/",
            "https://artsreview.com.au/category/theatre/page/2/",
            "https://artsreview.com.au/category/theatre/page/3/",
            "https://artsreview.com.au/category/theatre/page/4/",
            "https://artsreview.com.au/category/theatre/page/5/",
        ],
        "link_pattern": r'href="(https://artsreview\.com\.au/(?!category)[^"]+review[^"]*)"',
        "city": None,
        "country": "AU",
    },
    {
        "outlet": "Everything Theatre",
        "index_urls": [
            "https://everything-theatre.co.uk/category/reviews/",
            "https://everything-theatre.co.uk/category/reviews/page/2/",
            "https://everything-theatre.co.uk/category/reviews/page/3/",
            "https://everything-theatre.co.uk/category/reviews/page/4/",
            "https://everything-theatre.co.uk/category/reviews/page/5/",
        ],
        "link_pattern": r'href="(https://everything-theatre\.co\.uk/20\d\d/[^"]+review[^"]*)"',
        "city": "London",
        "country": "GB",
    },
    {
        "outlet": "West End Wilma",
        "index_urls": [
            "https://westendwilma.com/category/reviews/",
            "https://westendwilma.com/category/reviews/page/2/",
            "https://westendwilma.com/category/reviews/page/3/",
            "https://westendwilma.com/category/reviews/page/4/",
            "https://westendwilma.com/category/reviews/page/5/",
        ],
        "link_pattern": r'href="(https://westendwilma\.com/[^"]+review[^"]*)"',
        "city": "London",
        "country": "GB",
    },
    {
        "outlet": "Exeunt Magazine",
        "index_urls": [
            "https://exeuntmagazine.com/category/reviews/",
            "https://exeuntmagazine.com/category/reviews/page/2/",
            "https://exeuntmagazine.com/category/reviews/page/3/",
            "https://exeuntmagazine.com/category/reviews/page/4/",
            "https://exeuntmagazine.com/category/reviews/page/5/",
        ],
        "link_pattern": r'href="(https://exeuntmagazine\.com/reviews/[^"]+)"',
        "city": "London",
        "country": "GB",
    },
    {
        "outlet": "Limelight",
        "index_urls": [
            "https://limelight-arts.com.au/live-reviews/",
            "https://limelight-arts.com.au/live-reviews/page/2/",
            "https://limelight-arts.com.au/live-reviews/page/3/",
        ],
        "link_pattern": r'href="(https://limelight-arts\.com\.au/live-reviews/[^"]+)"',
        "city": None,
        "country": "AU",
    },
    {
        "outlet": "ArtsHub",
        "index_urls": [
            "https://www.artshub.com.au/category/performing-arts/reviews/",
            "https://www.artshub.com.au/category/performing-arts/reviews/page/2/",
            "https://www.artshub.com.au/category/performing-arts/reviews/page/3/",
            "https://www.artshub.com.au/category/performing-arts/reviews/page/4/",
            "https://www.artshub.com.au/category/performing-arts/reviews/page/5/",
        ],
        "link_pattern": r'href="(https://www\.artshub\.com\.au/[^"]+review[^"]*)"',
        "city": None,
        "country": "AU",
    },
]

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.skip = False
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'nav', 'header', 'footer'):
            self.skip = True
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'nav', 'header', 'footer'):
            self.skip = False
    def handle_data(self, data):
        if not self.skip and data.strip():
            self.text.append(data.strip())

def fetch_page(url):
    try:
        r = requests.get(url, timeout=15, headers=HEADERS)
        if r.status_code == 200:
            return r.text
    except:
        pass
    return None

def extract_text(html):
    parser = TextExtractor()
    parser.feed(html)
    return ' '.join(parser.text)[:4000]

def extract_stars_from_html(html):
    matches = re.findall(r'[★]{1,5}[½]?', html)
    if matches:
        best = max(matches, key=len)
        full_stars = best.count('★')
        has_half = '½' in best
        rating = full_stars + (0.5 if has_half else 0)
        if 1 <= rating <= 5:
            return rating
    # Also check for "X stars" pattern
    star_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:out of\s*)?stars?', html, re.IGNORECASE)
    if star_match:
        rating = float(star_match.group(1))
        if 1 <= rating <= 5:
            return rating
    return None

def extract_review_claude(text):
    try:
        response = claude.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[{"role": "user", "content": EXTRACT_PROMPT + f"\n\nReview text: {text}"}]
        )
        raw = response.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw[raw.find("{"):raw.rfind("}")+1]
        return json.loads(raw)
    except:
        return None

def get_all_productions():
    result = supabase.table("productions").select("id, city, country, shows(title, company)").execute()
    return result.data

def find_production(title, city, country, productions):
    if not title:
        return None
    title_lower = title.lower().strip()
    # Exact match with city
    for p in productions:
        show = p.get("shows", {})
        if not show:
            continue
        if show.get("title", "").lower().strip() == title_lower:
            if city and p.get("city", "").lower() == city.lower():
                return p["id"]
            if country and p.get("country", "").upper() == country.upper():
                return p["id"]
    # Fuzzy title match
    for p in productions:
        show = p.get("shows", {})
        if show and title_lower in show.get("title", "").lower():
            return p["id"]
    return None

def get_existing_urls():
    result = supabase.table("critic_reviews").select("source_url").execute()
    return set(r["source_url"] for r in result.data if r["source_url"])

# Main backfill
existing_urls = get_existing_urls()
all_productions = get_all_productions()
print(f"Existing URLs: {len(existing_urls)}")
print(f"Productions in DB: {len(all_productions)}")

total_imported = 0

for source in ARCHIVE_SOURCES:
    outlet = source["outlet"]
    print(f"\n{'='*50}")
    print(f"Processing {outlet}...")
    
    # Collect all review URLs from index pages
    review_urls = set()
    for index_url in source["index_urls"]:
        html = fetch_page(index_url)
        if not html:
            print(f"  Could not fetch {index_url}")
            continue
        matches = re.findall(source["link_pattern"], html)
        review_urls.update(matches)
        print(f"  Found {len(matches)} URLs from {index_url}")
    
    print(f"  Total unique URLs: {len(review_urls)}")
    new_urls = [u for u in review_urls if u not in existing_urls]
    print(f"  New URLs to process: {len(new_urls)}")
    
    imported = 0
    for url in new_urls:
        html = fetch_page(url)
        if not html:
            continue
        
        # Try direct star extraction from HTML first
        star_rating = extract_stars_from_html(html)
        
        # Extract text and use Claude
        text = extract_text(html)
        extracted = extract_review_claude(text)
        
        if not extracted or float(extracted.get("confidence", 0)) < 0.7:
            continue
        
        # Use HTML star rating if Claude didn't find one
        if star_rating and not extracted.get("star_rating"):
            extracted["star_rating"] = star_rating
        
        city = extracted.get("city") or source["city"]
        country = source["country"]
        production_id = find_production(extracted.get("show_title"), city, country, all_productions)
        
        if not production_id:
            continue
        
        review = {
            "production_id": production_id,
            "outlet": outlet,
            "reviewer": extracted.get("reviewer"),
            "published_date": None,
            "star_rating": extracted.get("star_rating"),
            "normalised_score": int(float(extracted["star_rating"]) * 20) if extracted.get("star_rating") else None,
            "pull_quote": extracted.get("pull_quote"),
            "source_url": url,
            "auto_imported": True,
            "confidence_score": float(extracted.get("confidence", 0)),
            "status": "approved",
        }
        
        try:
            supabase.table("critic_reviews").insert(review).execute()
            existing_urls.add(url)
            imported += 1
            stars = f"{extracted.get('star_rating')}★" if extracted.get("star_rating") else "no rating"
            print(f"  ✓ {extracted.get('show_title')} — {stars}")
        except Exception as e:
            pass
        
        time.sleep(0.2)
    
    print(f"  Imported {imported} reviews from {outlet}")
    total_imported += imported

print(f"\n{'='*50}")
print(f"TOTAL IMPORTED: {total_imported}")
