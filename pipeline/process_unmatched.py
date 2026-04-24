import os
import json
import time
from supabase import create_client
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SECRET_KEY")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
claude = Anthropic(api_key=ANTHROPIC_API_KEY)

COVERED_CITIES = [
    'Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide',
    'Hobart', 'Canberra', 'Auckland', 'Wellington', 'London'
]

COVERED_COUNTRIES = ['AU', 'NZ', 'GB']

DECISION_PROMPT = """You are helping curate StageGauge, a review aggregator for live theatre, opera, ballet, musicals and dance across Australia, New Zealand and London.

I have an unmatched review for a show. Please research this show and decide whether to include it.

Show details from the review:
- Title: {title}
- City: {city}
- Country: {country}
- Outlet that reviewed it: {outlet}
- Pull quote: {pull_quote}

Please research this show online and respond with JSON only, no other text:

{{
  "include": true or false,
  "reason": "brief explanation",
  "show_title": "correct canonical title",
  "company": "producing company name",
  "venue": "venue name",
  "city": "city",
  "country": "AU, NZ, or GB",
  "type": "theatre, musical, opera, ballet, dance, or concert",
  "season_start": "YYYY-MM-DD or null",
  "season_end": "YYYY-MM-DD or null"
}}

Include the show if:
- It is a professional or semi-professional production of theatre, opera, ballet, musical, dance or concert
- It is in one of these cities: {covered_cities}
- It has been reviewed by a legitimate arts publication

Do NOT include if:
- It is comedy, stand-up, cabaret, or variety
- It is amateur or student theatre
- It is outside the covered cities
- It is in the US or other uncovered markets (New York, Edinburgh etc.)
- The title or details suggest it is not a performing arts production

Return JSON only."""


def extract_json_from_response(content_blocks):
    """
    Extract JSON from Claude's response content blocks.
    Handles cases where the model uses web search tools before responding,
    which produces tool_use/tool_result blocks alongside the final text block.
    Falls back to scanning all text content if the primary text block is empty.
    """
    # First pass: collect all text from text blocks
    raw = ""
    for block in content_blocks:
        if hasattr(block, 'text') and block.text:
            raw += block.text

    if raw.strip():
        return raw.strip()

    # Second pass: check tool_result blocks for any embedded text
    for block in content_blocks:
        block_type = getattr(block, 'type', None)
        if block_type == 'tool_result':
            content = getattr(block, 'content', None)
            if isinstance(content, list):
                for item in content:
                    if hasattr(item, 'text') and item.text:
                        raw += item.text
            elif isinstance(content, str):
                raw += content

    return raw.strip()


def parse_decision(raw):
    """
    Parse JSON decision from Claude's raw text response.
    Handles markdown code fences and leading/trailing whitespace.
    Returns parsed dict or raises ValueError if no valid JSON found.
    """
    if not raw:
        raise ValueError("Empty response from Claude")

    # Strip markdown code fences if present
    if "```" in raw:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            raw = raw[start:end]

    # Find the JSON object boundaries in case there's surrounding text
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start != -1 and end > start:
        raw = raw[start:end]

    return json.loads(raw)


def get_or_create_show(title, company, show_type):
    existing = supabase.table("shows").select("id").ilike("title", title).eq("company", company).execute()
    if existing.data and len(existing.data) > 0:
        print(f"     Show already exists, reusing")
        return existing.data[0]["id"]
    result = supabase.table("shows").insert({
        "title": title,
        "company": company,
        "type": show_type
    }).execute()
    show_id = result.data[0]["id"]
    print(f"     Created show: {title}")
    return show_id


def create_production(show_id, venue, city, country, season_start, season_end):
    result = supabase.table("productions").insert({
        "show_id": show_id,
        "venue": venue,
        "city": city,
        "country": country,
        "season_start": season_start,
        "season_end": season_end,
    }).execute()
    return result.data[0]["id"]


def review_url_exists(url):
    if not url:
        return False
    result = supabase.table("critic_reviews").select("id").eq("source_url", url).execute()
    return len(result.data) > 0


def process_unmatched():
    print("Loading unmatched reviews queue...")

    result = supabase.table("unmatched_reviews").select("*").eq("status", "pending").order("created_at", desc=True).execute()
    items = result.data or []
    print(f"Found {len(items)} pending unmatched reviews\n")

    if not items:
        print("Queue is empty — nothing to process.")
        return

    included = 0
    dismissed = 0
    skipped = 0
    errors = 0

    for i, item in enumerate(items):
        title = item.get("show_title") or "Unknown"
        city = item.get("city") or "Unknown"
        country = item.get("country") or "Unknown"
        outlet = item.get("outlet") or "Unknown"
        pull_quote = item.get("pull_quote") or "None"

        print(f"[{i+1}/{len(items)}] {title} ({city}) — {outlet}")

        # Skip unknown titles — leave as pending for manual review in admin UI
        if title == "Unknown":
            print(f"  -> Skipped: title unknown — left as pending for manual review")
            skipped += 1
            continue

        # Dismiss out-of-scope cities immediately (but not Unknown city — let Claude decide)
        if city and city not in COVERED_CITIES and city != "Unknown":
            print(f"  -> Dismissed: city '{city}' not covered")
            supabase.table("unmatched_reviews").update({"status": "dismissed"}).eq("id", item["id"]).execute()
            dismissed += 1
            continue

        # Dismiss out-of-scope countries immediately (but not Unknown — let Claude decide)
        if country and country not in COVERED_COUNTRIES and country != "Unknown":
            print(f"  -> Dismissed: country '{country}' not covered")
            supabase.table("unmatched_reviews").update({"status": "dismissed"}).eq("id", item["id"]).execute()
            dismissed += 1
            continue

        prompt = DECISION_PROMPT.format(
            title=title,
            city=city,
            country=country,
            outlet=outlet,
            pull_quote=pull_quote,
            covered_cities=", ".join(COVERED_CITIES)
        )

        time.sleep(15)

        try:
            response = claude.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1000,
                tools=[{"type": "web_search_20250305", "name": "web_search"}],
                messages=[{"role": "user", "content": prompt}]
            )

            raw = extract_json_from_response(response.content)

            if not raw:
                # Empty response — leave as pending, do not count as hard error
                print(f"  -> No response from Claude — left as pending, will retry next run")
                skipped += 1
                continue

            decision = parse_decision(raw)

        except (ValueError, json.JSONDecodeError) as e:
            # Parsing failed — leave as pending for retry
            print(f"  -> Could not parse response — left as pending, will retry next run ({e})")
            skipped += 1
            continue
        except Exception as e:
            print(f"  -> Error processing: {e}")
            errors += 1
            continue

        if not decision.get("include"):
            print(f"  -> Dismissed: {decision.get('reason', 'not suitable')}")
            supabase.table("unmatched_reviews").update({"status": "dismissed"}).eq("id", item["id"]).execute()
            dismissed += 1
            continue

        print(f"  -> Including: {decision.get('show_title')} at {decision.get('venue')} ({decision.get('type')})")

        try:
            show_id = get_or_create_show(
                decision["show_title"],
                decision["company"],
                decision["type"]
            )

            prod_id = create_production(
                show_id,
                decision.get("venue"),
                decision.get("city"),
                decision.get("country"),
                decision.get("season_start"),
                decision.get("season_end")
            )

            if not review_url_exists(item.get("source_url")):
                supabase.table("critic_reviews").insert({
                    "production_id": prod_id,
                    "outlet": item["outlet"],
                    "reviewer": item.get("reviewer"),
                    "published_date": item.get("published_date"),
                    "star_rating": item.get("star_rating"),
                    "normalised_score": int(item["star_rating"] * 20) if item.get("star_rating") else None,
                    "pull_quote": item.get("pull_quote"),
                    "source_url": item.get("source_url"),
                    "auto_imported": True,
                    "confidence_score": item.get("confidence", 0.9),
                    "status": "approved",
                }).execute()
            else:
                print(f"     Review URL already exists, skipping insert")

            supabase.table("unmatched_reviews").update({"status": "approved"}).eq("id", item["id"]).execute()

            included += 1
            print(f"     Show live on site")

        except Exception as e:
            print(f"  -> Error creating show: {e}")
            errors += 1

    print(f"\n{'='*50}")
    print(f"Done. Included: {included}, Dismissed: {dismissed}, Skipped (pending): {skipped}, Errors: {errors}")
    print(f"\nNow run this in Supabase SQL editor:")
    print(f"SELECT recalculate_all_scores();")


if __name__ == "__main__":
    process_unmatched()