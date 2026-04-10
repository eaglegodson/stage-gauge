import os
import json
import re
import requests
from html.parser import HTMLParser
from supabase import create_client
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SECRET_KEY"])
claude = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

PROMPT = """You are a theatre review analyst. Read this review text and extract ONLY an explicit star rating if one is given.

Return JSON only:
{{
  "star_rating": 4.5
}}

star_rating must be a number out of 5. Only return a rating if it is EXPLICITLY stated in the text (e.g. "4 stars", "★★★★", "3.5/5", "8/10" converted to 5-scale). If no explicit rating is given, return null.

Do NOT infer from sentiment. Return null if unsure.

Review text:
{text}"""

def extract_stars_from_html(html):
    """Directly extract ★ characters from raw HTML before stripping tags."""
    # Look for patterns like ★★★★ or ★★½ in the raw HTML
    matches = re.findall(r'[★]{1,5}[½]?', html)
    if matches:
        # Take the longest match (most stars)
        best = max(matches, key=len)
        full_stars = best.count('★')
        has_half = '½' in best
        rating = full_stars + (0.5 if has_half else 0)
        if 1 <= rating <= 5:
            return rating
    return None

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
        r = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0 StageGauge/1.0"})
        if r.status_code == 200:
            return r.text
    except:
        pass
    return None

def extract_text(html):
    parser = TextExtractor()
    parser.feed(html)
    return ' '.join(parser.text)[:4000]

def extract_star_rating_claude(text):
    try:
        response = claude.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=100,
            messages=[{"role": "user", "content": PROMPT.format(text=text)}]
        )
        raw = response.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw[raw.find("{"):raw.rfind("}")+1]
        data = json.loads(raw)
        return data.get("star_rating")
    except:
        return None

# Get all approved reviews with no star rating
result = supabase.table("critic_reviews").select("id, source_url, outlet").eq("status", "approved").is_("star_rating", "null").execute()
reviews = result.data
print(f"Found {len(reviews)} reviews to backfill")

updated = 0
for review in reviews:
    url = review.get("source_url")
    if not url:
        continue

    html = fetch_page(url)
    if not html:
        print(f"  ✗ Could not fetch: {review['outlet']}")
        continue

    # First try direct ★ extraction from raw HTML
    rating = extract_stars_from_html(html)
    method = "HTML stars"

    # If not found, try Claude on plain text
    if rating is None:
        text = extract_text(html)
        rating = extract_star_rating_claude(text)
        method = "Claude"

    if rating is None:
        print(f"  – No rating found: {review['outlet']}")
        continue

    supabase.table("critic_reviews").update({
        "star_rating": rating,
        "normalised_score": min(100, max(0, int(float(rating) * 20)))
    }).eq("id", review["id"]).execute()
    updated += 1
    print(f"  ✓ {review['outlet']} → {rating}★ ({method})")

print(f"\nDone. Updated {updated} of {len(reviews)} reviews.")
