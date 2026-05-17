import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function sitemap() {
  const baseUrl = 'https://stage-gauge.com'

  // Static pages
  const staticPages = [
    '',
    '/browse',
    '/reviews',
    '/community',
    '/about',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Dynamic show pages
  const { data: productions } = await supabase
    .from('production_listing')
    .select('production_id')

  const showPages = (productions || []).map(p => ({
    url: `${baseUrl}/show/${p.production_id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...showPages]
}
