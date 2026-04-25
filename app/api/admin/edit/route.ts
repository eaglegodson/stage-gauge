import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  const { show_id, production_id, showData, productionData, userEmail } = await req.json()

  if (userEmail !== 'hadimaz@gmail.com') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 })
  }

  const { error: showErr } = await adminSupabase
    .from('shows')
    .update(showData)
    .eq('id', show_id)

  if (showErr) return NextResponse.json({ error: showErr.message }, { status: 500 })

  const { error: prodErr } = await adminSupabase
    .from('productions')
    .update(productionData)
    .eq('id', production_id)

  if (prodErr) return NextResponse.json({ error: prodErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
