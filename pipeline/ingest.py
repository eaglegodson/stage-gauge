import os
import json
import feedparser
import requests
from datetime import datetime
from supabase import create_client
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SECRET_KEY")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
claude = Anthropic(api_key=ANTHROPIC_API_KEY)

FEEDS = [
    {"outlet": "ArtsHub", "url": "https://www.artshub.com.au/feed/", "city": None, "country": "AU"},
    {"outlet": "The Age", "url": "https://www.theage.com.au/rss/feed.xml", "city": "Melbourne", "country": "AU"},
    {"outlet": "Sydney Morning Herald", "url": "https://www.smh.com.au/rss/feed.xml", "city": "Sydney", "country": "AU"},
]

EXTRACTION_PROMPT = """You are an arts review extraction assistant. Given the text of a performing arts review, extract the following and return as JSON only with no other text:

{{
  "outlet": "name of publication",
  "reviewer": "critic name or null",
  "star_rating": 4.5,
  "pull_quote": "best sentence under 25 words or null",
  "show_title": "name of production",
  "company": "performing company or null",
  "city": "city or null",
  "is_arts_review": true,
  "confidence": 0.9
}}

is_arts_review should be true only for theatre, musical, opera, ballet, dance, or concert reviews.
star_rating should be null if not mentioned.
Return JSON only. No markdown. No explanation.

Review text:
{text}

Known shows: {shows}"""


def get_known_shows():
    result = supabase.table("shows").select("title, company").execute()
    return [f"{s['title']} by {s['company']}" for s in result.data]


def get_existing_urls():
    result = supabase.table("critic_reviews").select("source_url").execute()
    return {r["source_url"] for r in result.data if r["source_url"]}


def fetch_feed(url):
    try:
        resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0 StageGauge/1.0"})
        return feedparser.parse(resp.text)
    except Exception as e:
        print(f"  Feed fetch error: {e}")
        return None


def extract_review(text, known_shows):
    try:
        response = claude.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            messages=[{
                "role": "user",
                "content": EXTRACTION_PROMPT.format(
                    text=text[:2000],
                    shows=", ".join(known_shows[:30])
                )
            }]
        )
        raw = response.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw[raw.find("{"):]
            raw = raw[:raw.rfind("}")+1]
        return json.loads(raw)
    except Exception as e:
        print(f"  Extraction error: {e}")
        return None


def find_production(show_title):
    if not show_title:
        return None
    result = supabase.table("productions").select("id, shows(title)").execute()
    for prod in result.data:
        show = prod.get("shows") or {}
        db_title = (show.get("title") or "").lower()
        search_title = show_title.lower()
        if search_title in db_title or db_title in search_title:
            return prod["id"]
    return None


def normalise_score(star_rating):
    if star_rating is None:
        return None
    return min(100, max(0, int(float(star_rating) * 20)))


def run_pipeline():
    print(f"Pipeline starting at {datetime.now()}")
    known_shows = get_known_shows()
    print(f"Loaded {len(known_shows)} shows from database")
    existing_urls = get_existing_urls()
    imported = 0
    skipped = 0

    for feed in FEEDS:
        print(f"\nFetching {feed['outlet']}...")
        parsed = fetch_feed(feed["url"])
        if not parsed:
            continue

        entries = parsed.entries[:20]
        print(f"  Found {len(entries)} entries")

        for entry in entries:
            url = entry.get("link", "")
            if not url or url in existing_urls:
                skipped += 1
                continue

            title = entry.get("title", "")
            summary = entry.get("summary", "")
            text = f"{title}\n\n{summary}"

            extracted = extract_review(text, known_shows)
            if not extracted:
                continue

            if not extracted.get("is_arts_review"):
                continue

            confidence = float(extracted.get("confidence", 0))
            production_id = find_production(extracted.get("show_title"))

            if not production_id:
                print(f"  No DB match: {extracted.get('show_title')}")
                continue

            normalised = normalise_score(extracted.get("star_rating"))
            status = "approved" if confidence >= 0.85 else "pending"

            review = {
                "production_id": production_id,
                "outlet": feed["outlet"],
                "reviewer": extracted.get("reviewer"),
                "published_date": entry.get("published", None),
                "star_rating": extracted.get("star_rating"),
                "normalised_score": normalised,
                "pull_quote": extracted.get("pull_quote"),
                "source_url": url,
                "auto_imported": True,
                "confidence_score": confidence,
                "status": status,
            }

            try:
                supabase.table("critic_reviews").insert(review).execute()
                existing_urls.add(url)
                imported += 1
                print(f"  ✓ {extracted.get('show_title')} [{status}] score:{normalised}")
            except Exception as e:
                print(f"  ✗ Insert error: {e}")

    print(f"\nDone. Imported: {imported}, Skipped: {skipped}")


if __name__ == "__main__":
    run_pipeline()
