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
    {"outlet": "The Age", "url": "https://www.theage.com.au/rss/entertainment/arts.xml", "city": "Melbourne", "country": "AU"},
    {"outlet": "Sydney Morning Herald", "url": "https://www.smh.com.au/rss/entertainment/arts.xml", "city": "Sydney", "country": "AU"},
    {"outlet": "ArtsHub", "url": "https://www.artshub.com.au/feed/", "city": None, "country": "AU"},
    {"outlet": "Time Out Melbourne", "url": "https://www.timeout.com/melbourne/feed.xml", "city": "Melbourne", "country": "AU"},
    {"outlet": "Time Out Sydney", "url": "https://www.timeout.com/sydney/feed.xml", "city": "Sydney", "country": "AU"},
]

EXTRACTION_PROMPT = """You are an arts review extraction assistant. Given the text of a performing arts review, extract:
1. outlet: name of the publication
2. reviewer: critic's name if present (null if not)
3. star_rating: numeric rating out of 5 (null if not present)
4. pull_quote: the single most representative sentence from the review (max 25 words, null if nothing suitable)
5. show_title: the name of the production being reviewed
6. company: the performing company (null if not clear)
7. city: city where the performance took place (null if not clear)
8. is_arts_review: true if this is a performing arts review (theatre, musical, opera, ballet, dance, concert), false otherwise
9. confidence: your confidence 0-1 that you've extracted correctly

Return JSON only. No other text.

Review text: {text}

Known shows in database: {shows}"""


def get_known_shows():
    result = supabase.table("shows").select("title, company").execute()
    return [f"{s['title']} by {s['company']}" for s in result.data]


def get_existing_urls():
    result = supabase.table("critic_reviews").select("source_url").execute()
    return {r["source_url"] for r in result.data if r["source_url"]}


def fetch_article_text(url):
    try:
        resp = requests.get(url, timeout=10, headers={"User-Agent": "StageGauge/1.0"})
        return resp.text[:3000]
    except:
        return None


def extract_review(text, known_shows):
    try:
        response = claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[{
                "role": "user",
                "content": EXTRACTION_PROMPT.format(
                    text=text[:2000],
                    shows=", ".join(known_shows[:50])
                )
            }]
        )
        raw = response.content[0].text.strip()
        return json.loads(raw)
    except Exception as e:
        print(f"Extraction error: {e}")
        return None


def find_production(show_title, company, city):
    result = supabase.table("productions").select("id, shows(title, company)").execute()
    for prod in result.data:
        show = prod.get("shows", {})
        if show_title and show_title.lower() in (show.get("title") or "").lower():
            return prod["id"]
    return None


def normalise_score(star_rating):
    if star_rating is None:
        return None
    return min(100, max(0, int(float(star_rating) * 20)))


def run_pipeline():
    print(f"Pipeline starting at {datetime.now()}")
    known_shows = get_known_shows()
    existing_urls = get_existing_urls()
    imported = 0
    skipped = 0

    for feed in FEEDS:
        print(f"\nFetching {feed['outlet']}...")
        try:
            parsed = feedparser.parse(feed["url"])
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
                production_id = find_production(
                    extracted.get("show_title"),
                    extracted.get("company"),
                    extracted.get("city") or feed.get("city")
                )

                if not production_id:
                    print(f"  No match found for: {extracted.get('show_title')}")
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
                    print(f"  ✓ Imported: {extracted.get('show_title')} ({status})")
                except Exception as e:
                    print(f"  ✗ Insert error: {e}")

        except Exception as e:
            print(f"  Feed error: {e}")

    print(f"\nDone. Imported: {imported}, Skipped: {skipped}")


if __name__ == "__main__":
    run_pipeline()