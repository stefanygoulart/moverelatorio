const BASE = 'https://graph.facebook.com/v19.0'

export interface AdAccount {
  id: string
  name: string
  account_status: number
  currency: string
  business?: { id: string; name: string }
}

export interface CampaignInsight {
  campaign_id: string
  campaign_name: string
  spend: number
  impressions: number
  reach: number
  clicks: number
  ctr: number
  cpm: number
  cpc: number
  leads: number
  purchases: number
  actions: Record<string, number>
}

export interface AccountInsight {
  total_spend: number
  total_impressions: number
  total_reach: number
  total_clicks: number
  total_leads: number
  total_purchases: number
  ctr: number
  cpm: number
  cpc: number
  cpa: number
  frequency: number
  conv_rate: number
  roas: number
  campaigns: CampaignInsight[]
}

async function metaFetch(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('access_token', token)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { next: { revalidate: 300 } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Meta API error ${res.status}`)
  }
  return res.json()
}

export async function getAdAccounts(token: string): Promise<AdAccount[]> {
  const data = await metaFetch('/me/adaccounts', token, {
    fields: 'id,name,account_status,currency,business{id,name}',
    limit: '100',
  })
  return (data.data || []).map((a: any) => ({
    id: a.id.replace('act_', ''),
    name: a.name || `Conta ${a.id}`,
    account_status: a.account_status,
    currency: a.currency || 'BRL',
    business: a.business,
  }))
}

function parseActions(actions: any[] = [], key: string): number {
  const found = actions.find((a: any) => a.action_type === key)
  return found ? parseFloat(found.value) || 0 : 0
}

export async function getAccountInsights(
  accountId: string,
  token: string,
  dateStart: string,
  dateEnd: string
): Promise<AccountInsight> {
  const timeRange = JSON.stringify({ since: dateStart, until: dateEnd })
  const fields = [
    'spend', 'impressions', 'reach', 'clicks', 'ctr', 'cpm', 'cpc',
    'frequency', 'actions', 'action_values', 'purchase_roas',
  ].join(',')

  const [accountData, campaignsData] = await Promise.all([
    metaFetch(`/act_${accountId}/insights`, token, {
      fields,
      time_range: timeRange,
      level: 'account',
    }),
    metaFetch(`/act_${accountId}/insights`, token, {
      fields: `campaign_id,campaign_name,${fields}`,
      time_range: timeRange,
      level: 'campaign',
      limit: '50',
    }),
  ])

  const acc = accountData.data?.[0] || {}
  const leads = parseActions(acc.actions, 'lead') + parseActions(acc.actions, 'onsite_conversion.lead_grouped')
  const purchases = parseActions(acc.actions, 'purchase') + parseActions(acc.actions, 'omni_purchase')
  const spend = parseFloat(acc.spend) || 0
  const clicks = parseInt(acc.clicks) || 0
  const cpa = leads > 0 ? spend / leads : 0
  const roas = acc.purchase_roas?.[0]?.value ? parseFloat(acc.purchase_roas[0].value) : 0
  const convRate = clicks > 0 ? (leads / clicks) * 100 : 0

  const campaigns: CampaignInsight[] = (campaignsData.data || []).map((c: any) => {
    const cLeads = parseActions(c.actions, 'lead') + parseActions(c.actions, 'onsite_conversion.lead_grouped')
    const cPurchases = parseActions(c.actions, 'purchase') + parseActions(c.actions, 'omni_purchase')
    const cSpend = parseFloat(c.spend) || 0
    return {
      campaign_id: c.campaign_id,
      campaign_name: c.campaign_name,
      spend: cSpend,
      impressions: parseInt(c.impressions) || 0,
      reach: parseInt(c.reach) || 0,
      clicks: parseInt(c.clicks) || 0,
      ctr: parseFloat(c.ctr) || 0,
      cpm: parseFloat(c.cpm) || 0,
      cpc: parseFloat(c.cpc) || 0,
      leads: cLeads,
      purchases: cPurchases,
      actions: {},
    }
  }).sort((a: CampaignInsight, b: CampaignInsight) => b.spend - a.spend)

  return {
    total_spend: spend,
    total_impressions: parseInt(acc.impressions) || 0,
    total_reach: parseInt(acc.reach) || 0,
    total_clicks: clicks,
    total_leads: leads,
    total_purchases: purchases,
    ctr: parseFloat(acc.ctr) || 0,
    cpm: parseFloat(acc.cpm) || 0,
    cpc: parseFloat(acc.cpc) || 0,
    cpa,
    frequency: parseFloat(acc.frequency) || 0,
    conv_rate: convRate,
    roas,
    campaigns,
  }
}
