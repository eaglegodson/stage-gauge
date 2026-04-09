import { supabase } from '../../../lib/supabase'

export default async function ShowPage({ params }) {
  const { id } = await params

  const { data: production } = await supabase
    .from('production_listing')
    .select('*')
    .eq('production_id', id)
    .single()

  const { data: criticReviews } = await supabase
    .from('approved_critic_reviews')
    .select('*')
    .eq('production_id', id)
    .order('published_date', { ascending: false })

  if (!production) {
    return <div className="p-8">Show not found</div>
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 px-6 py-4">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-600">← Stage Gauge</a>
      </header>

      {/* Show hero */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{production.type}</span>
              <span className="text-xs text-gray-400">{production.city}</span>
            </div>
            <h1 className="font-serif text-3xl font-semibold text-gray-900 leading-tight mb-1">{production.title}</h1>
            <p className="text-gray-500">{production.company}</p>
            <p className="text-sm text-gray-400 mt-1">{production.venue}</p>
            {production.director && <p className="text-sm text-gray-400">Dir. {production.director}</p>}
            {production.lead_performer && <p className="text-sm text-gray-400">Starring {production.lead_performer}</p>}
          </div>

          {production.combined_score && (
            <div className="flex flex-col items-center flex-shrink-0 bg-gray-50 rounded-2xl p-4">
              <div className="text-4xl font-bold mb-2" style={{color: '#1D9E75'}}>{Math.round(production.combined_score)}</div>
              <div className="flex gap-1 mb-2">
                {[1,2,3,4,5].map((bar) => (
                  <div key={bar} className="w-2 h-6 rounded-sm" style={{backgroundColor: Math.round(production.combined_score) >= bar * 20 ? '#1D9E75' : '#E5E7EB'}}></div>
                ))}
              </div>
              <div className="text-xs text-gray-400 text-center">Stage Gauge score</div>
              {production.critic_score && (
                <div className="mt-3 text-xs text-gray-500 text-center">
                  <div>Critics: <span className="font-semibold">{Math.round(production.critic_score)}</span></div>
                  <div>Audience: <span className="font-semibold">{Math.round(production.audience_score || 0)}</span></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Critic Reviews */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Critic reviews · {criticReviews?.length || 0}
          </h2>
          {criticReviews && criticReviews.length > 0 ? (
            <div className="space-y-3">
              {criticReviews.map((review) => (
                <div key={review.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-900">{review.outlet}</span>
                        {review.reviewer && <span className="text-sm text-gray-400">{review.reviewer}</span>}
                      </div>
                      {review.pull_quote && (
                        <p className="text-sm text-gray-600 italic">"{review.pull_quote}"</p>
                      )}
                    </div>
                    {review.normalised_score && (
                      <div className="text-xl font-bold flex-shrink-0" style={{color: '#1D9E75'}}>
                        {review.normalised_score}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No critic reviews yet.</p>
          )}
        </div>
      </div>
    </main>
  )
}