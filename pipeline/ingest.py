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
    # ANZ - dedicated arts feeds
    {"outlet": "ArtsHub", "url": "https://www.artshub.com.au/feed/", "city": None, "country": "AU"},
    {"outlet": "The Scoop", "url": "https://thescoop.au/feed", "city": None, "country": "AU"},
    {"outlet": "Limelight", "url": "https://limelight-arts.com.au/live-reviews/feed", "city": None, "country": "AU"},
    {"outlet": "Aussie Theatre", "url": "https://aussietheatre.com.au/feed", "city": None, "country": "AU"},
    {"outlet": "Stage Noise", "url": "https://stagenoise.com/rss", "city": "Sydney", "country": "AU"},
    {"outlet": "Australian Arts Review", "url": "https://artsreview.com.au/category/theatre/feed/", "city": None, "country": "AU"},
    {"outlet": "Suzy Goes See", "url": "http://www.suzygoessee.com/feed", "city": "Sydney", "country": "AU"},
    {"outlet": "Theatre Matters", "url": "https://theatrematters.com.au/feed", "city": None, "country": "AU"},
    # ANZ - general (arts section filtered by AI)
    {"outlet": "The Age", "url": "https://www.theage.com.au/rss/feed.xml", "city": "Melbourne", "country": "AU"},
    {"outlet": "Sydney Morning Herald", "url": "https://www.smh.com.au/rss/feed.xml", "city": "Sydney", "country": "AU"},
    {"outlet": "Brisbane Times", "url": "https://www.brisbanetimes.com.au/rss/feed.xml", "city": "Brisbane", "country": "AU"},
    {"outlet": "Stuff NZ", "url": "https://www.stuff.co.nz/rss", "city": None, "country": "NZ"},
    # London - dedicated theatre feeds
    {"outlet": "The Guardian", "url": "https://www.theguardian.com/stage/rss", "city": "London", "country": "GB"},
    {"outlet": "WhatsOnStage", "url": "https://www.whatsonstage.com/news/feed.rss", "city": "London", "country": "GB"},
    {"outlet": "The Stage", "url": "https://www.thestage.co.uk/feed", "city": "London", "country": "GB"},
    {"outlet": "West End Wilma", "url": "https://westendwilma.com/feed", "city": "London", "country": "GB"},
    {"outlet": "Everything Theatre", "url": "https://everything-theatre.co.uk/feed", "city": "London", "country": "GB"},
    {"outlet": "London Theatre", "url": "https://www.londontheatre.co.uk/feed", "city": "London", "country": "GB"},
]

EXTRACTION_PROMPT = """You are an arts review extraction assistant. Given the text of a performing arts review, extract the following and return as JSON only with no other text:

{{
  "outlet": "name of publication",
  "reviewer": "critic name or null",
  "star_rating": 4.5,
  "pull_quote": "best sentence under 25 words or null",
  "show_title": "canonical name of production only - no subtitles or venue names",
  "company": "performing company or null",
  "city": "city where the show is performing or null",
  "country": "country code e.g. GB, AU, US or null",
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


def get_all_productions():
    result = supabase.table("productions").select("id, city, country, shows(title)").execute()
    return result.data


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


def title_match(search_title, db_title):
    search = search_title.lower().strip()
    db = db_title.lower().strip()

    if search in db or db in search:
        return True

    for suffix in [': the musical', ' - the musical', ', still living it!', ' at micf',
                   ' plays a talk show host', ' review', ' - review']:
        search = search.replace(suffix, '').strip()
        db = db.replace(suffix, '').strip()

    if search in db or db in search:
        return True

    stop_words = {'the', 'a', 'an', 'and', 'or', 'of', 'in', 'at', 'to', 'is', 'it', 's'}
    search_words = {w for w in search.split() if w not in stop_words and len(w) > 2}
    db_words = {w for w in db.split() if w not in stop_words and len(w) > 2}

    if len(search_words) > 0 and len(db_words) > 0:
        overlap = search_words & db_words
        overlap_ratio = len(overlap) / min(len(search_words), len(db_words))
        if overlap_ratio >= 0.6 and len(overlap) >= 2:
            return True

    return False


def find_production(show_title, city=None, country=None, all_productions=None):
    if not show_title or not all_productions:
        return None

    if city:
        for prod in all_productions:
            show = prod.get("shows") or {}
            db_title = show.get("title") or ""
            prod_city = (prod.get("city") or "").lower()
            if title_match(show_title, db_title) and city.lower() in prod_city:
                return prod["id"]

    if country:
        for prod in all_productions:
            show = prod.get("shows") or {}
            db_title = show.get("title") or ""
            prod_country = (prod.get("country") or "").upper()
            if title_match(show_title, db_title) and country.upper() == prod_country:
                return prod["id"]

    return None


def normalise_score(star_rating):
    if star_rating is None:
        return None
    return min(100, max(0, int(float(star_rating) * 20)))


def run_pipeline():
    print(f"Pipeline starting at {datetime.now()}")
    known_shows = get_known_shows()
    all_productions = get_all_productions()
    print(f"Loaded {len(known_shows)} shows, {len(all_productions)} productions")
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
            city = extracted.get("city") or feed.get("city")
            country = extracted.get("country") or feed.get("country")
            production_id = find_production(extracted.get("show_title"), city, country, all_productions)

            if not production_id:
                print(f"  No DB match: {extracted.get('show_title')} ({city})")
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
