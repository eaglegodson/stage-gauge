<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into StageGauge. Here is a summary of all changes made:

- **`instrumentation-client.ts`** (new file) — Initialises PostHog client-side using the `posthog-js` SDK via the recommended Next.js 15.3+ `instrumentation-client` entry point. Includes exception capture and a reverse proxy `api_host`.
- **`next.config.ts`** — Added `rewrites` to proxy PostHog ingestion and static asset requests through `/ingest/...`, improving reliability and ad-blocker resistance. Also set `skipTrailingSlashRedirect: true`.
- **`.env.local`** — Added `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` environment variables.
- **`app/auth/page.tsx`** — Captures `user_signed_up` on successful account creation; captures `user_signed_in` and calls `posthog.identify()` (using Supabase user ID + email + display name) on successful sign-in; calls `posthog.captureException()` on auth errors.
- **`app/show/[id]/page.tsx`** — Captures `show_page_viewed` (with title, type, company, city) when production data loads; `show_watchlisted` when a user adds a show; `show_unmarked_seen` / `show_marked_seen` on seen toggle; `tickets_link_clicked` when the Buy Tickets link is clicked.
- **`app/show/[id]/review.tsx`** — Captures `review_submitted` (with star rating and whether text/date were included) on successful review insert; calls `posthog.captureException()` on Supabase errors.
- **`app/search/page.tsx`** — Captures `search_performed` with query text and result count after each search.
- **`app/watchlist/page.tsx`** — Captures `show_removed_from_watchlist` (with show title, type, city) when a user removes a show.
- **`app/browse/page.tsx`** — Captures `browse_filter_applied` (with filter name and selected values) whenever City, Company, Type, or Timing filters are changed.

## Events

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User successfully creates a new account | `app/auth/page.tsx` |
| `user_signed_in` | User successfully signs in; PostHog user is identified | `app/auth/page.tsx` |
| `show_page_viewed` | User views a show/production detail page | `app/show/[id]/page.tsx` |
| `tickets_link_clicked` | User clicks the Buy tickets link on a show page | `app/show/[id]/page.tsx` |
| `show_watchlisted` | User adds a show to their watchlist | `app/show/[id]/page.tsx` |
| `show_removed_from_watchlist` | User removes a show from their watchlist | `app/watchlist/page.tsx` |
| `show_marked_seen` | User marks a show as seen | `app/show/[id]/page.tsx` |
| `show_unmarked_seen` | User unmarks a show as seen | `app/show/[id]/page.tsx` |
| `review_submitted` | User successfully submits an audience review | `app/show/[id]/review.tsx` |
| `search_performed` | User executes a search query | `app/search/page.tsx` |
| `browse_filter_applied` | User changes a filter on the browse page | `app/browse/page.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://eu.posthog.com/project/161522/dashboard/628961
- **Sign-up & Sign-in funnel**: https://eu.posthog.com/project/161522/insights/TIKuXrQZ
- **Show discovery to ticket intent funnel**: https://eu.posthog.com/project/161522/insights/zQ30XaRa
- **Review submission funnel**: https://eu.posthog.com/project/161522/insights/6iJabCKV
- **Watchlist activity over time**: https://eu.posthog.com/project/161522/insights/q3XQYPp7
- **New user signups over time**: https://eu.posthog.com/project/161522/insights/UV3gkcla

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
