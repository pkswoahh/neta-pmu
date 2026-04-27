import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, UserOption, OptionType } from '@/types/database'
import { useAuth } from './AuthContext'

interface ProfileCtx {
  profile: Profile | null
  options: UserOption[]
  loading: boolean
  refresh: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<void>
  byType: (t: OptionType) => UserOption[]
}

const Ctx = createContext<ProfileCtx | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [options, setOptions] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setOptions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const [{ data: p }, { data: o }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('user_options').select('*').eq('user_id', user.id).order('order', { ascending: true }),
    ])
    if (p) {
      setProfile(p as Profile)
    } else {
      // El trigger debería haber creado el perfil; si no, lo creamos ahora.
      const { data: created } = await supabase.from('profiles').insert({ id: user.id, currency: 'COP', monthly_goal: 0 }).select().maybeSingle()
      setProfile((created as Profile) ?? null)
    }
    setOptions((o ?? []) as UserOption[])
    setLoading(false)
  }, [user])

  useEffect(() => { void refresh() }, [refresh])

  async function updateProfile(patch: Partial<Profile>) {
    if (!user) return
    const { data } = await supabase.from('profiles').update(patch).eq('id', user.id).select().maybeSingle()
    if (data) setProfile(data as Profile)
  }

  function byType(t: OptionType) {
    return options.filter(o => o.type === t).sort((a, b) => a.order - b.order)
  }

  return (
    <Ctx.Provider value={{ profile, options, loading, refresh, updateProfile, byType }}>
      {children}
    </Ctx.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
