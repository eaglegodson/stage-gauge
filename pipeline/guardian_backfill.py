import os
import json
import requests
from supabase import create_client
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SECRET_KEY"])
claude = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
GUARDIAN_API_KEY = os.environ.get("GUARDIAN_API_KEY", "ad3eeb51-81df-49ca-ac81-8c195bee341e")

PROMPT = """You are an arts review extraction assistant. Given the text of a performing arts review, extract:
1. show_title: the name of the production being reviewed
2. company: the performing company (if mentioned)
3. city: city where the performance took place
4. reviewer: critic's name if present
5. pull_quote: the single most representative sentence (max 25 words)
6. star_rating: numeric rating out of 5 (null if not explicitly stated)
7. confidence: your confidence (0-1) that this is a performing arts review

Return JSON only. No other text."""

def get_existing_urls():
    result = supabase.table("critic_reviews").select("source_url").execute()
    return set(r["source_url"] for r in result.data if r["source_url"])

def get_all_productions():
    result = supabase.table("productions").select("id, city, country, shows(title, company)").execute()
    return result.data

def find_production(title, city, country, productions):
    if not title:
        return None
    title_lower = title.lower().strip()
    for p in productions:
        show = p.get("shows", {})
        if not show:
            continue
        if show.get("title", "").lower().strip() == title_lower:
            if country and p.get("country", "").upper() == country.upper():
                return p["id"]
            if city and p.get("city", "").lower() == city.lower():
                return p["id"]
    # Fuzzy: just title match
    for p in productions:
        show = p.get("shows", {})
        if show and title_lower in show.get("title", "").lower():
            return p["id"]
    return None

def extract_review(text):
    try:
        response = claude.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[{"role": "user", "content": PROMPT + f"\n\nReview text: {text[:3000]}"}]
        )
        raw = response.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw[raw.find("{"):raw.rfind("}")+1]
        return json.loads(raw)
    except:
        return None

existing_urls = get_existing_urls()
all_productions = get_all_productions()

print(f"Existing URLs: {len(existing_urls)}")
print(f"Productions in DB: {len(all_productions)}")

imported = 0
no_match = []
page = 1
total_fetched = 0

while page <= 20:  # fetch up to 10 pages = 500 articles
    print(f"\nFetching page {page}...")
    params = {
        "api-key": GUARDIAN_API_KEY,
        "section": "stage",
        "type": "article",
        "tag": "tone/reviews",
        "show-fields": "headline,byline,starRating,bodyText,shortUrl",
        "page-size": 50,
        "order-by": "newest",
        "page": page,
        "from-date": "2025-01-01"
    }
    
    try:
        r = requests.get("https://content.guardianapis.com/search", params=params, timeout=15)
        data = r.json()
    except Exception as e:
        print(f"  Error: {e}")
        break

    results = data.get("response", {}).get("results", [])
    total_pages = data.get("response", {}).get("pages", 1)
    print(f"  Got {len(results)} articles (page {page} of {total_pages})")
    
    if not results:
        break

    for item in results:
        fields = item.get("fields", {})
        url = fields.get("shortUrl") or item.get("webUrl", "")
        
        if not url:
            continue

        total_fetched += 1
        star_rating_raw = fields.get("starRating")
        star_rating = float(star_rating_raw) if star_rating_raw else None

        headline = fields.get("headline", "")
        body = fields.get("bodyText", "")[:2000]
        text = f"{headline}\n\n{body}"

        extracted = extract_review(text)
        if not extracted or float(extracted.get("confidence", 0)) < 0.7:
            continue

        city = extracted.get("city") or "London"
        country = "GB"
        production_id = find_production(extracted.get("show_title"), city, country, all_productions)

        if not production_id:
            no_match.append(f"{extracted.get('show_title')} ({city})")
            continue

        if star_rating is not None:
            extracted["star_rating"] = star_rating

        review = {
            "production_id": production_id,
            "outlet": "The Guardian",
            "reviewer": fields.get("byline"),
            "published_date": item.get("webPublicationDate", "")[:10] or None,
            "star_rating": extracted.get("star_rating"),
            "normalised_score": int(float(extracted.get("star_rating", 0)) * 20) if extracted.get("star_rating") else None,
            "pull_quote": extracted.get("pull_quote"),
            "source_url": url,
            "auto_imported": True,
            "confidence_score": float(extracted.get("confidence", 0)),
            "status": "approved",
        }

        try:
            # Check if review already exists
            existing = supabase.table("critic_reviews").select("id,star_rating").eq("source_url", url).execute()
            if existing.data:
                # Update star rating if we now have one and didn't before
                if review.get("star_rating") and not existing.data[0].get("star_rating"):
                    supabase.table("critic_reviews").update({
                        "star_rating": review["star_rating"],
                        "production_id": review["production_id"],
                        "status": "approved"
                    }).eq("source_url", url).execute()
                    imported += 1
                    print(f"  ↑ Updated: {extracted.get('show_title')} — {extracted.get('star_rating')}★")
            else:
                supabase.table("critic_reviews").insert(review).execute()
                existing_urls.add(url)
                imported += 1
                print(f"  ✓ {extracted.get('show_title')} — {extracted.get('star_rating')}★")
        except Exception as e:
            print(f"  ✗ {e}")

    if page >= total_pages:
        break
    page += 1

print(f"\n--- Done ---")
print(f"Total new articles processed: {total_fetched}")
print(f"Imported: {imported}")
print(f"\nNo DB match ({len(no_match)} shows):")
for s in sorted(set(no_match)):
    print(f"  {s}")
