import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HomeClient from '@/components/HomeClient'
import type { Profile } from '@/lib/types'

export default async function HomePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <HomeClient profile={(profile as Profile) ?? null} />
}
