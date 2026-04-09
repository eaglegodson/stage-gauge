'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [productions, setProductions] = useState<any[]>([])
    const [typeFilter, setTypeFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')

  useEffect(() => {
    async function fetchProductions() {
      let query = supabase
        .from('production_listing')
        .select('*')
        .not('combined_score', 'is', null)
        .order('combined_score', { ascending: false })

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter)
      }

      if (cityFilter !== 'all') {
        query = query.eq('city', cityFilter)
      }

      const { data, error } = await query
      if (!error) setProductions(data)
    }
    fetchProductions()
  }, [typeFilter, cityFilter])

  const typeFilters = ['all', 'theatre', 'musical', 'opera', 'ballet', 'dance']
  const cityFilters = ['all', 'Melbourne', 'Sydney', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Hobart', 'Auckland', 'Wellington', 'Christchurch', 'London']

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900">Stage Gauge</h1>
          <p className="text-xs text-gray-400 mt-0.5">The home for live performance reviews</p>
        </div>
        <button className="text-sm text-white px-4 py-2 rounded-full" style={{backgroundColor: '#1D9E75'}}>
          Sign in
        </button>
      </header>
      <div className="border-b border-gray-100 px-6 py-3 flex gap-2 overflow-x-auto">
        {typeFilters.map((f) => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors capitalize"
            style={{
              backgroundColor: typeFilter === f ? '#1D9E75' : '#F3F4F6',
              color: typeFilter === f ? 'white' : '#6B7280'
            }}
          >
            {f === 'all' ? 'All types' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div className="border-b border-gray-100 px-6 py-3 flex gap-2 overflow-x-auto">
        {cityFilters.map((c) => (
          <button
            key={c}
            onClick={() => setCityFilter(c)}
            className="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
            style={{
              backgroundColor: cityFilter === c ? '#111827' : '#F3F4F6',
              color: cityFilter === c ? 'white' : '#6B7280'
            }}
          >
            {c === 'all' ? 'All cities' : c}
          </button>
        ))}
      </div>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
          Now showing
        </h2>
        <div className="space-y-4">
          {productions?.map((p) => (<a
            
              key={p.production_id}
              href={"/show/" + p.production_id}
              className="block border border-gray-100 rounded-xl p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{p.type}</span>
                    <span className="text-xs text-gray-400">{p.city}</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-gray-900 leading-tight">{p.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{p.company} · {p.venue}</p>
                </div>
                {p.combined_score && (
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="text-2xl font-bold" style={{color: '#1D9E75'}}>{Math.round(p.combined_score)}</div>
                    <div className="flex gap-0.5 mt-1">
                      {[1,2,3,4,5].map((bar) => (
                        <div key={bar} className="w-1.5 h-4 rounded-sm" style={{backgroundColor: Math.round(p.combined_score) >= bar * 20 ? '#1D9E75' : '#E5E7EB'}}></div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{(p.critic_count || 0) + (p.audience_count || 0)} reviews</div>
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
