'use client'
import { useRef } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
} from 'chart.js'
import type { AccountInsight, CampaignInsight } from '@/lib/meta'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const GREEN = ['#1a5c3a','#2d8a5e','#3aaa73','#5bc98f','#8ddbb5','#b3e8d0','#d9f4e8']

function fmtBRL(n: number, dec = 2) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
function fmtInt(n: number) { return n.toLocaleString('pt-BR') }

function getCpaStatus(cpa: number, minCpa: number): { cls: string; label: string } {
  if (!cpa || minCpa === 0) return { cls: 'bg-green-100 text-green-700', label: 'Eficiente' }
  const r = cpa / minCpa
  if (r <= 1.3) return { cls: 'bg-green-100 text-green-700', label: 'Eficiente' }
  if (r <= 2.0) return { cls: 'bg-yellow-100 text-yellow-700', label: 'Médio' }
  return { cls: 'bg-red-100 text-red-700', label: 'Alto CPA' }
}

interface Props {
  accountName: string
  accountId:   string
  agencyName:  string
  dateStart:   string
  dateEnd:     string
  data:        AccountInsight
}

export default function ReportView({ accountName, accountId, agencyName, dateStart, dateEnd, data }: Props) {
  const fmtDate = (s: string) => {
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
  }
  const period    = `${fmtDate(dateStart)} a ${fmtDate(dateEnd)}`
  const today     = new Date().toLocaleDateString('pt-BR')
  const campaigns = data.campaigns || []
  const minCpa    = Math.min(...campaigns.map(c => c.leads > 0 ? c.spend / c.leads : Infinity).filter(v => isFinite(v)))
  const totalInvest = data.total_spend
  const best      = campaigns.reduce<CampaignInsight | null>((b, c) => {
    const cpa = c.leads > 0 ? c.spend / c.leads : Infinity
    if (!b) return c
    const bCpa = b.leads > 0 ? b.spend / b.leads : Infinity
    return cpa < bCpa ? c : b
  }, null)

  const chartLabels = campaigns.map(c => c.campaign_name.length > 22 ? c.campaign_name.slice(0, 22) + '…' : c.campaign_name)

  const Header = () => (
    <div className="bg-[#1a5c3a] px-8 py-6 flex justify-between items-start">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-base leading-tight">{agencyName}</p>
          <p className="text-white/60 text-xs tracking-widest uppercase">Business Intelligence</p>
        </div>
      </div>
      <div className="text-right">
        <h2 className="text-white font-bold text-xl leading-tight">{accountName}</h2>
        <span className="mt-2 inline-block bg-white/20 text-white text-xs px-4 py-1 rounded-full">{period.toUpperCase()}</span>
      </div>
    </div>
  )

  const Footer = ({ section }: { section: string }) => (
    <div className="bg-gray-50 border-t border-gray-100 px-8 py-3 flex justify-between text-[10px] text-gray-400 uppercase tracking-wider">
      <span>{agencyName.toUpperCase()} — BPO REPORTS</span>
      <span>{accountName.toUpperCase()} — {section}</span>
      <span>GERADO EM {today}</span>
    </div>
  )

  const KpiCard = ({ label, value, desc, accent }: { label: string; value: string; desc: string; accent: string }) => (
    <div className={`border border-gray-100 rounded-xl p-4 relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${accent}`} />
      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold mb-1 ${
        accent.includes('blue') ? 'text-blue-600' :
        accent.includes('amber') || accent.includes('orange') ? 'text-amber-700' :
        accent.includes('purple') ? 'text-purple-700' : 'text-[#1a5c3a]'
      }`}>{value}</p>
      <p className="text-[10px] text-gray-300">{desc}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* PÁGINA 1 — RESUMO */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
        <Header />
        {/* Top strip */}
        <div className="grid grid-cols-5 divide-x divide-gray-100 border-t border-gray-100">
          {[
            { l: 'Total investido',  v: `R$ ${fmtBRL(data.total_spend)}` },
            { l: 'Leads / Eventos',  v: fmtInt(data.total_leads) },
            { l: 'CPA (custo/lead)', v: `R$ ${fmtBRL(data.cpa)}` },
            { l: 'Impressões',       v: fmtInt(data.total_impressions) },
            { l: 'Alcance único',    v: fmtInt(data.total_reach) },
          ].map(k => (
            <div key={k.l} className="px-5 py-4">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{k.l}</p>
              <p className="text-xl font-bold text-[#1a5c3a]">{k.v}</p>
            </div>
          ))}
        </div>

        <div className="px-8 py-6">
          <div className="flex items-center gap-2 mb-5 pl-3 border-l-[3px] border-[#1a5c3a]">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-600">Resumo geral da conta no período</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <KpiCard label="Leads / Conversões" value={fmtInt(data.total_leads)} desc="Eventos trackados pelo Pixel" accent="bg-[#1a5c3a]" />
            <KpiCard label="CPA — Custo por lead" value={`R$ ${fmtBRL(data.cpa)}`} desc="Custo unitário de aquisição" accent="bg-[#1a5c3a]" />
            <KpiCard label="ROAS (retorno de mídia)" value={`${fmtBRL(data.roas)}x`} desc="Registrado no Pixel Meta" accent="bg-amber-500" />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <KpiCard label="Impressões"      value={fmtInt(data.total_impressions)} desc="Exibições totais"              accent="bg-blue-500" />
            <KpiCard label="Alcance único"   value={fmtInt(data.total_reach)}       desc="Pessoas distintas"             accent="bg-blue-500" />
            <KpiCard label="Frequência média" value={`${fmtBRL(data.frequency, 2)}x`} desc="Vezes que cada pessoa viu"  accent="bg-blue-500" />
            <KpiCard label="CTR (taxa de clique)" value={`${fmtBRL(data.ctr, 2)}%`} desc="Qualidade dos criativos"      accent="bg-purple-600" />
            <KpiCard label="CPM (custo/1.000)"    value={`R$ ${fmtBRL(data.cpm)}`}  desc="Eficiência no leilão"         accent="bg-purple-600" />
            <KpiCard label="CPC (custo por clique)" value={`R$ ${fmtBRL(data.cpc)}`} desc="Cliques em links"            accent="bg-purple-600" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Total de cliques"   value={fmtInt(data.total_clicks)}       desc="Cliques no período"  accent="bg-[#1a5c3a]" />
            <KpiCard label="Taxa de conversão"  value={`${fmtBRL(data.conv_rate, 2)}%`} desc="Lead / Clique"       accent="bg-[#1a5c3a]" />
            <KpiCard label="Compras no pixel"   value={fmtInt(data.total_purchases)}    desc="Registros de Purchase" accent="bg-[#1a5c3a]" />
          </div>
        </div>
        <Footer section="Resumo Geral" />
      </div>

      {/* PÁGINA 2 — CAMPANHAS */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 page-break">
          <Header />
          <div className="px-8 py-6">
            <div className="flex items-center gap-2 mb-5 pl-3 border-l-[3px] border-[#1a5c3a]">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-600">Desempenho por campanha — detalhamento completo</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#1a5c3a] text-white">
                    {['Campanha','Investido','% Verba','Impressões','Alcance','Cliques','CTR','CPM','CPC','Leads','CPA','Status'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => {
                    const cpa    = c.leads > 0 ? c.spend / c.leads : 0
                    const pct    = totalInvest > 0 ? ((c.spend / totalInvest) * 100).toFixed(1) + '%' : '—'
                    const status = getCpaStatus(cpa, minCpa)
                    return (
                      <tr key={c.campaign_id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-3 py-2.5 max-w-[180px] font-medium text-gray-800">{c.campaign_name}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">R$ {fmtBRL(c.spend)}</td>
                        <td className="px-3 py-2.5">{pct}</td>
                        <td className="px-3 py-2.5">{fmtInt(c.impressions)}</td>
                        <td className="px-3 py-2.5">{fmtInt(c.reach)}</td>
                        <td className="px-3 py-2.5">{fmtInt(c.clicks)}</td>
                        <td className="px-3 py-2.5">{fmtBRL(c.ctr, 2)}%</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">R$ {fmtBRL(c.cpm)}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">R$ {fmtBRL(c.cpc)}</td>
                        <td className="px-3 py-2.5 font-medium">{c.leads}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-medium">R$ {fmtBRL(cpa)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${status.cls}`}>{status.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-[#1a5c3a] text-white font-bold">
                    <td className="px-3 py-2.5">Total geral</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">R$ {fmtBRL(totalInvest)}</td>
                    <td className="px-3 py-2.5">100%</td>
                    <td className="px-3 py-2.5">{fmtInt(data.total_impressions)}</td>
                    <td className="px-3 py-2.5">{fmtInt(data.total_reach)}</td>
                    <td className="px-3 py-2.5">{fmtInt(data.total_clicks)}</td>
                    <td className="px-3 py-2.5">{fmtBRL(data.ctr, 2)}%</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">R$ {fmtBRL(data.cpm)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">R$ {fmtBRL(data.cpc)}</td>
                    <td className="px-3 py-2.5">{data.total_leads}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">R$ {fmtBRL(data.cpa)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex gap-4 flex-wrap mt-3 text-[10px] text-gray-500">
              <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-100 border border-green-600 mr-1" />Eficiente — CPA até 30% acima do melhor</span>
              <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-yellow-100 border border-yellow-600 mr-1" />Médio — CPA até 2× o melhor</span>
              <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-600 mr-1" />Alto CPA — Requer otimização</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="border border-gray-100 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">🏆 Melhor campanha (menor CPA)</p>
                <p className="font-bold text-[#1a5c3a] text-base leading-snug">{best?.campaign_name || '—'}</p>
                <p className="text-xs text-gray-400 mt-1">
                  CPA: R$ {best && best.leads > 0 ? fmtBRL(best.spend / best.leads) : '—'} • {best?.leads || 0} leads
                </p>
              </div>
              <div className="border border-gray-100 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">📊 Taxa de conversão geral</p>
                <p className="font-bold text-[#1a5c3a] text-3xl">{fmtBRL(data.conv_rate, 2)}%</p>
                <p className="text-xs text-gray-400 mt-1">{fmtInt(data.total_leads)} leads de {fmtInt(data.total_clicks)} cliques</p>
              </div>
            </div>
          </div>
          <Footer section="Análise de Campanhas" />
        </div>
      )}

      {/* PÁGINA 3 — GRÁFICOS */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 page-break">
          <Header />
          <div className="px-8 py-6">
            <div className="flex items-center gap-2 mb-5 pl-3 border-l-[3px] border-[#1a5c3a]">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-600">Visão gráfica do período</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border border-gray-100 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3 pl-2 border-l-2 border-[#1a5c3a]">Distribuição de verba por campanha</p>
                <div className="h-48">
                  <Doughnut
                    data={{ labels: campaigns.map(c => c.campaign_name.slice(0, 30)), datasets: [{ data: campaigns.map(c => c.spend), backgroundColor: GREEN, borderWidth: 2, borderColor: '#fff' }] }}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '60%' }}
                  />
                </div>
              </div>
              <div className="border border-gray-100 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3 pl-2 border-l-2 border-[#1a5c3a]">Leads por campanha</p>
                <div className="h-48">
                  <Bar
                    data={{ labels: chartLabels, datasets: [{ data: campaigns.map(c => c.leads), backgroundColor: GREEN, borderRadius: 4 }] }}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 9 } } } } }}
                  />
                </div>
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-4 mb-4">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3 pl-2 border-l-2 border-[#1a5c3a]">CPA por campanha (custo de aquisição por lead — R$)</p>
              <div style={{ height: Math.max(campaigns.length * 44 + 50, 160) }}>
                <Bar
                  data={{ labels: chartLabels, datasets: [{ data: campaigns.map(c => c.leads > 0 ? +(c.spend / c.leads).toFixed(2) : 0), backgroundColor: campaigns.map(c => { const cpa = c.leads > 0 ? c.spend/c.leads : 0; return cpa > minCpa*2 ? '#e24b4a' : cpa > minCpa*1.3 ? '#f59e0b' : '#1a5c3a' }), borderRadius: 4 }] }}
                  options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: (v: any) => `R$${Number(v).toFixed(2)}`, font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } } }}
                />
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3 pl-2 border-l-2 border-[#1a5c3a]">CTR por campanha (%) — qualidade dos criativos</p>
              <div style={{ height: Math.max(campaigns.length * 44 + 50, 160) }}>
                <Bar
                  data={{ labels: chartLabels, datasets: [{ data: campaigns.map(c => +c.ctr.toFixed(2)), backgroundColor: '#7c3aed', borderRadius: 4 }] }}
                  options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: (v: any) => `${v}%`, font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } } }}
                />
              </div>
            </div>
          </div>
          <Footer section="Análise Visual" />
        </div>
      )}
    </div>
  )
}
