'use client'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import ReportView from '@/components/report/ReportView'
import type { AccountInsight } from '@/lib/meta'

interface ReportData {
  accountId:   string
  accountName: string
  status:      'loading' | 'done' | 'error'
  data?:       AccountInsight
  error?:      string
}

function ReportPageInner() {
  const { data: session, status } = useSession()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const printRef     = useRef<HTMLDivElement>(null)

  const accountIds = (searchParams.get('accounts') || '').split(',').filter(Boolean)
  const dateStart  = searchParams.get('dateStart') || ''
  const dateEnd    = searchParams.get('dateEnd')   || ''
  const agencyName = process.env.NEXT_PUBLIC_AGENCY_NAME || 'Move Reports'

  const [reports,  setReports]  = useState<ReportData[]>(accountIds.map(id => ({ accountId: id, accountName: id, status: 'loading' })))
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated' || !accountIds.length) return

    const fetchAll = async () => {
      for (let i = 0; i < accountIds.length; i++) {
        const id = accountIds[i]
        try {
          const res = await fetch(`/api/meta/insights?accountId=${id}&dateStart=${dateStart}&dateEnd=${dateEnd}`)
          const json = await res.json()
          if (json.error) throw new Error(json.error)
          setReports(prev => prev.map(r => r.accountId === id
            ? { ...r, status: 'done', data: json.insights, accountName: json.accountName || id }
            : r
          ))
        } catch (e: any) {
          setReports(prev => prev.map(r => r.accountId === id
            ? { ...r, status: 'error', error: e.message }
            : r
          ))
        }
        setProgress(Math.round(((i + 1) / accountIds.length) * 100))
      }
    }

    fetchAll()
  }, [status])

  const handlePrint = () => window.print()

  const fmtDate = (s: string) => { const [y,m,d] = s.split('-'); return `${d}/${m}/${y}` }

  const allDone = reports.every(r => r.status !== 'loading')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar — esconde no print */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="btn-secondary text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Voltar
          </button>
          <div>
            <p className="text-sm font-semibold text-gray-800">{reports.length} relatório(s)</p>
            <p className="text-xs text-gray-400">{fmtDate(dateStart)} a {fmtDate(dateEnd)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!allDone && (
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-100 rounded-full h-1.5">
                <div className="bg-brand-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-gray-400">{progress}%</span>
            </div>
          )}
          <button onClick={handlePrint} disabled={!allDone} className="btn-primary text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Conteúdo dos relatórios */}
      <div ref={printRef} className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        {reports.map(r => (
          <div key={r.accountId}>
            {r.status === 'loading' && (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-600 border-t-transparent mx-auto mb-4" />
                <p className="text-gray-500">Buscando dados de <strong>{r.accountName}</strong>...</p>
              </div>
            )}
            {r.status === 'error' && (
              <div className="bg-white rounded-xl border border-red-100 p-8 text-center">
                <p className="text-red-500 font-medium mb-1">Erro ao carregar {r.accountName}</p>
                <p className="text-gray-400 text-sm">{r.error}</p>
              </div>
            )}
            {r.status === 'done' && r.data && (
              <ReportView
                accountName={r.accountName}
                accountId={r.accountId}
                agencyName={agencyName}
                dateStart={dateStart}
                dateEnd={dateEnd}
                data={r.data}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense>
      <ReportPageInner />
    </Suspense>
  )
}
