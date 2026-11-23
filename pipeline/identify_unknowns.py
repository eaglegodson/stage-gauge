import os
import re
import json
import time
import html
import httpx
from supabase import create_client
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SECRET_KEY"])
claude = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

# Reuse the exact model process_unmatched.py uses, so we know it's valid
here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, "process_unmatched.py")) as f:
    m = re.search(r'model\s*=\s*["\']([^"\']+)["\']', f.read(), re.I)
if not m:
    raise SystemExit("Couldn't find the model name in process_unmatched.py")
MODEL = m.group(1)

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"}

PROMPT = """This is a theatre/arts review from {outlet}. Identify the show being reviewed.

URL: {url}
Pull quote: {quote}
Page title: {page_title}
Page text (start): {text}

Respond with JSON only, no other text:
{{
  "is_review": true or false,
  "show_title": "title of the show as it would appear on a poster, or null if you can't tell",
  "company": "producing company or null",
  "city": "city where it is performed or null",
  "country": "AU, NZ, GB, or other two-letter code, or null"
}}

Only give a show_title if you are confident. Do not guess."""


def fetch(url):
    try:
        r = httpx.get(url, headers=HEADERS, timeout=20, follow_redirects=True)
        r.raise_for_status()
    except Exception as e:
        return "", "(page could not be loaded: %s)" % str(e)[:80]
    raw = r.text
    t = re.search(r"<title[^>]*>(.*?)</title>", raw, re.S | re.I)
    page_title = html.unescape(t.group(1).strip()) if t else ""
    body = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", raw, flags=re.S | re.I)
    body = re.sub(r"<[^>]+>", " ", body)
    body = html.unescape(re.sub(r"\s+", " ", body))[:6000]
    return page_title, body


def parse(text):
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        return None
    try:
        return json.loads(text[start:end + 1])
    except Exception:
        return None


def blank(v):
    return v is None or str(v).strip() == "" or str(v).strip().lower() == "unknown"


rows = (supabase.table("unmatched_reviews")
        .select("id, outlet, city, country, company, source_url, pull_quote, show_title")
        .eq("status", "pending")
        .or_("show_title.is.null,show_title.ilike.unknown")
        .execute().data)

print(f"Model: {MODEL}")
print(f"Found {len(rows)} pending reviews with no title\n")
identified = left = 0

for i, row in enumerate(rows, 1):
    url = row.get("source_url") or ""
    print(f"[{i}/{len(rows)}] {row.get('outlet')} — {url[:90]}")
    page_title, text = fetch(url) if url else ("", "(no URL)")
    try:
        resp = claude.messages.create(
            model=MODEL,
            max_tokens=300,
            messages=[{"role": "user", "content": PROMPT.format(
                outlet=row.get("outlet"), url=url, quote=row.get("pull_quote") or "",
                page_title=page_title, text=text)}],
        )
        out = parse("".join(b.text for b in resp.content if getattr(b, "type", "") == "text"))
    except Exception as e:
        print(f"  -> Error: {str(e)[:100]}")
        out = None

    if not out or not out.get("is_review") or blank(out.get("show_title")):
        print("  -> Couldn't identify — left for manual review")
        left += 1
    else:
        update = {"show_title": out["show_title"].strip()}
        if blank(row.get("city")) and not blank(out.get("city")):
            update["city"] = out["city"]
        if blank(row.get("country")) and not blank(out.get("country")):
            update["country"] = out["country"]
        if blank(row.get("company")) and not blank(out.get("company")):
            update["company"] = out["company"]
        supabase.table("unmatched_reviews").update(update).eq("id", row["id"]).execute()
        print(f"  -> {update['show_title']} ({update.get('city', row.get('city'))})")
        identified += 1
    time.sleep(2)

print(f"\n{'='*50}")
print(f"Done. Identified: {identified}, Left for manual review: {left}")
print("Next: python3 process_unmatched.py, then SELECT recalculate_all_scores();")
