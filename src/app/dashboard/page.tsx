'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Account {
  id: string
  name: string
  account_status: number
  currency: string
  business?: { id: string; name: string }
}

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  1:  { label: 'Ativa',      color: 'bg-green-100 text-green-700' },
  2:  { label: 'Desativada', color: 'bg-gray-100 text-gray-500'   },
  3:  { label: 'Não paga',   color: 'bg-red-100 text-red-600'     },
  7:  { label: 'Arquivada',  color: 'bg-yellow-100 text-yellow-700'},
  9:  { label: 'Em análise', color: 'bg-blue-100 text-blue-700'   },
  101:{ label: 'Fechada',    color: 'bg-red-100 text-red-600'     },
}

function fmt(date: Date) {
  return date.toISOString().split('T')[0]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [accounts, setAccounts]       = useState<Account[]>([])
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [loading, setLoading]         = useState(true)
  const [generating, setGenerating]   = useState(false)
  const [error, setError]             = useState('')
  const [search, setSearch]           = useState('')

  const today   = new Date()
  const first   = new Date(today.getFullYear(), today.getMonth(), 1)
  const [dateStart, setDateStart] = useState(fmt(first))
  const [dateEnd,   setDateEnd]   = useState(fmt(today))

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/meta/accounts')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setAccounts(d.accounts || [])
      })
      .catch(() => setError('Erro ao carregar contas'))
      .finally(() => setLoading(false))
  }, [status])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => {
    const active = accounts.filter(a => a.account_status === 1).map(a => a.id)
    setSelected(new Set(active))
  }

  const handleGenerate = () => {
    if (selected.size === 0) return
    const ids = Array.from(selected).join(',')
    router.push(`/report?accounts=${ids}&dateStart=${dateStart}&dateEnd=${dateEnd}`)
  }

  const filtered = accounts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.business?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const activeFiltered   = filtered.filter(a => a.account_status === 1)
  const inactiveFiltered = filtered.filter(a => a.account_status !== 1)

  if (status === 'loading' || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-600 border-t-transparent mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Carregando contas...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-600 text-white px-6 py-4 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-base leading-tight">{process.env.NEXT_PUBLIC_AGENCY_NAME || 'Move Reports'}</div>
            <div className="text-white/60 text-xs">{process.env.NEXT_PUBLIC_AGENCY_TAGLINE || 'Business Intelligence'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/80">{session?.user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-white/60 hover:text-white text-sm transition-colors">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Período */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            Período do relatório
          </h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Data início</label>
              <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-600" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Data fim</label>
              <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-600" />
            </div>
            <div className="flex gap-2">
              {[
                { label: 'Este mês',   start: fmt(first), end: fmt(today) },
                { label: 'Últimos 7d', start: fmt(new Date(today.getTime() - 6*86400000)), end: fmt(today) },
                { label: 'Últimos 30d',start: fmt(new Date(today.getTime() - 29*86400000)), end: fmt(today) },
              ].map(p => (
                <button key={p.label} onClick={() => { setDateStart(p.start); setDateEnd(p.end) }}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contas */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 2.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
              </svg>
              Contas de anúncio ({accounts.filter(a => a.account_status === 1).length} ativas)
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={selectAll} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Selecionar ativas</button>
              <button onClick={() => setSelected(new Set())} className="text-xs text-gray-400 hover:text-gray-600">Limpar</button>
            </div>
          </div>

          <input
            placeholder="Buscar conta ou business..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-brand-600"
          />

          {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {activeFiltered.map(acc => {
              const st = STATUS_MAP[acc.account_status] || { label: 'Desconhecida', color: 'bg-gray-100 text-gray-500' }
              const isSel = selected.has(acc.id)
              return (
                <div key={acc.id} onClick={() => toggle(acc.id)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${
                    isSel ? 'border-brand-600 bg-brand-50 shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">{acc.name}</p>
                      {acc.business && <p className="text-xs text-gray-400 truncate mt-0.5">{acc.business.name}</p>}
                      <p className="text-xs text-gray-300 mt-1">ID: {acc.id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                      {isSel && (
                        <div className="w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {inactiveFiltered.length > 0 && (
            <details className="mb-6">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                Ver {inactiveFiltered.length} conta(s) inativa(s)
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                {inactiveFiltered.map(acc => {
                  const st = STATUS_MAP[acc.account_status] || { label: 'Desconhecida', color: 'bg-gray-100 text-gray-500' }
                  return (
                    <div key={acc.id} className="border border-gray-100 rounded-xl p-4 opacity-50">
                      <p className="font-medium text-sm text-gray-700 truncate">{acc.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${st.color}`}>{st.label}</span>
                    </div>
                  )
                })}
              </div>
            </details>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {selected.size > 0 ? `${selected.size} conta(s) selecionada(s)` : 'Nenhuma conta selecionada'}
            </p>
            <button onClick={handleGenerate} disabled={selected.size === 0 || generating}
              className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
              </svg>
              Gerar {selected.size > 0 ? `${selected.size} ` : ''}relatório(s)
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
