import {Button, Card, Flex, Grid, Heading, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {type CSSProperties, useEffect, useMemo, useState} from 'react'
import {apiVersion} from '../env'
import {fetchWithRetry} from '../lib/fetchWithRetry'

type ThemeMode = 'dark' | 'light'
type RevenueRange = 'daily' | 'weekly' | 'monthly'

type OrderItemLite = {
  productId?: string
  productName?: string
  quantity?: number
}

type OrderLite = {
  _id: string
  orderNumber?: string
  customerName?: string
  email?: string
  orderDate?: string
  status?: string
  paymentStatus?: string
  paymentMethod?: string
  totalPrice?: number
  itemsCount?: number
  products?: OrderItemLite[]
}

type ProductLite = {
  _id: string
  name?: string
  stock?: number
  categoryTitles?: string[]
}

type DashboardPayload = {
  products: ProductLite[]
  orders: OrderLite[]
  brandsCount: number
  categoriesCount: number
  activePromoCount: number
  customerProfilesCount: number
}

type RevenuePoint = {
  label: string
  value: number
  x?: number
  y?: number
}

type Palette = {
  background: string
  text: string
  muted: string
  card: string
  border: string
  shadow: string
  track: string
  line: string
  accent: string
  success: string
  warning: string
  danger: string
}

const DASHBOARD_QUERY = `{
  "products": *[_type == "product"]{
    _id,
    name,
    stock,
    "categoryTitles": categories[]->title
  },
  "orders": *[_type == "order"]{
    _id,
    orderNumber,
    customerName,
    email,
    orderDate,
    status,
    paymentStatus,
    paymentMethod,
    totalPrice,
    "itemsCount": count(coalesce(products, [])),
    "products": coalesce(products, [])[]{
      quantity,
      "productId": product->_id,
      "productName": product->name
    }
  },
  "brandsCount": count(*[_type == "brand"]),
  "categoriesCount": count(*[_type == "category"]),
  "activePromoCount": count(*[_type == "promoCode" && active == true]),
  "customerProfilesCount": count(*[_type == "customerProfile"])
}`

const THEME_KEY = 'zayna_dashboard_theme'

const palettes: Record<ThemeMode, Palette> = {
  dark: {
    background:
      'radial-gradient(800px 340px at -5% -10%, rgba(13,110,79,0.28), transparent 52%), radial-gradient(700px 320px at 105% 0, rgba(201,168,76,0.2), transparent 56%), #081b16',
    text: '#f8faf9',
    muted: 'rgba(248,250,249,0.7)',
    card: 'rgba(12, 36, 29, 0.74)',
    border: 'rgba(201,168,76,0.24)',
    shadow: '0 18px 45px -28px rgba(0,0,0,.9)',
    track: 'rgba(248,250,249,0.12)',
    line: '#7cf3cc',
    accent: '#c9a84c',
    success: '#32c48d',
    warning: '#ffbf5a',
    danger: '#ff6d73',
  },
  light: {
    background:
      'radial-gradient(900px 350px at -5% -10%, rgba(13,110,79,0.12), transparent 54%), radial-gradient(700px 300px at 105% 0, rgba(201,168,76,0.2), transparent 58%), #f8faf9',
    text: '#14352b',
    muted: 'rgba(20,53,43,0.66)',
    card: 'rgba(255,255,255,.85)',
    border: 'rgba(13,110,79,0.18)',
    shadow: '0 16px 38px -28px rgba(13,52,41,.36)',
    track: 'rgba(20,53,43,0.1)',
    line: '#0d6e4f',
    accent: '#c9a84c',
    success: '#13855d',
    warning: '#ad7009',
    danger: '#cb3d4e',
  },
}

const DASHBOARD_CSS = `
@keyframes zaynaPulse {
  0% { opacity: .55; }
  50% { opacity: 1; }
  100% { opacity: .55; }
}
.zayna-skeleton {
  border-radius: 10px;
  animation: zaynaPulse 1.3s ease-in-out infinite;
  background: linear-gradient(90deg, rgba(255,255,255,.06), rgba(255,255,255,.2), rgba(255,255,255,.06));
}
.zayna-scroll::-webkit-scrollbar {
  height: 8px;
}
.zayna-scroll::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(201,168,76,.45);
}
.zayna-status-card {
  transition: transform .22s ease, filter .22s ease;
  height: 100%;
}
.zayna-status-card:hover {
  transform: translateY(-2px);
  filter: brightness(1.03);
}
.zayna-status-card-body {
  min-height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.zayna-status-label {
  min-height: 2.6em;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  line-height: 1.3;
}
.zayna-status-value {
  font-size: 26px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: .01em;
}
`

const currencyFormatter = new Intl.NumberFormat('fr-MA', {
  style: 'currency',
  currency: 'MAD',
  maximumFractionDigits: 0,
})

function toCurrency(value: number) {
  return currencyFormatter.format(value || 0)
}

function safeDate(value?: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function titleCaseStatus(value?: string) {
  if (!value) return 'Unknown'
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function dedupeOrders(orders: OrderLite[]) {
  const byKey = new Map<string, OrderLite>()
  for (const order of orders) {
    const key = order.orderNumber || order._id
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, order)
      continue
    }
    const oldDate = safeDate(existing.orderDate)?.getTime() ?? 0
    const newDate = safeDate(order.orderDate)?.getTime() ?? 0
    if (newDate >= oldDate) byKey.set(key, order)
  }
  return [...byKey.values()]
}

function isPaidOrder(order: OrderLite) {
  const payment = (order.paymentStatus || '').toLowerCase()
  const status = (order.status || '').toLowerCase()
  return payment === 'paid' || status === 'paid' || status === 'delivered'
}

function sumRevenue(orders: OrderLite[]) {
  return orders.reduce((sum, order) => sum + (order.totalPrice ?? 0), 0)
}

function buildSeries(orders: OrderLite[], range: RevenueRange): RevenuePoint[] {
  const now = new Date()
  const result: RevenuePoint[] = []

  if (range === 'daily') {
    for (let i = 13; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      const value = orders.reduce((sum, order) => {
        const date = safeDate(order.orderDate)
        if (!date || date < start || date >= end) return sum
        return sum + (order.totalPrice ?? 0)
      }, 0)
      result.push({label: `${start.getDate()}/${start.getMonth() + 1}`, value})
    }
    return result
  }

  if (range === 'weekly') {
    const startOfWeek = (date: Date) => {
      const value = new Date(date)
      const day = value.getDay()
      const diff = (day + 6) % 7
      value.setHours(0, 0, 0, 0)
      value.setDate(value.getDate() - diff)
      return value
    }
    for (let i = 11; i >= 0; i -= 1) {
      const ref = new Date(now)
      ref.setDate(ref.getDate() - i * 7)
      const start = startOfWeek(ref)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      const value = orders.reduce((sum, order) => {
        const date = safeDate(order.orderDate)
        if (!date || date < start || date >= end) return sum
        return sum + (order.totalPrice ?? 0)
      }, 0)
      result.push({label: `${start.getDate()}/${start.getMonth() + 1}`, value})
    }
    return result
  }

  for (let i = 11; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
    const value = orders.reduce((sum, order) => {
      const date = safeDate(order.orderDate)
      if (!date || date < start || date >= end) return sum
      return sum + (order.totalPrice ?? 0)
    }, 0)
    result.push({label: start.toLocaleString('en-US', {month: 'short'}), value})
  }

  return result
}

function mapSeriesToChart(points: RevenuePoint[], width: number, height: number) {
  if (!points.length) return points
  const padding = 22
  const values = points.map((point) => point.value)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const range = max - min || 1
  const step = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0

  return points.map((point, index) => {
    const ratio = (point.value - min) / range
    return {
      ...point,
      x: padding + index * step,
      y: height - padding - ratio * (height - padding * 2),
    }
  })
}

function buildPath(points: RevenuePoint[]) {
  if (!points.length) return ''
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x || 0} ${point.y || 0}`)
    .join(' ')
}

function statusStyle(value: string | undefined, mode: ThemeMode, kind: 'order' | 'payment'): CSSProperties {
  const status = (value || '').toLowerCase()
  const dark = mode === 'dark'
  const ok = {color: dark ? '#8bf1cb' : '#0d6e4f', bg: dark ? 'rgba(39,199,139,.15)' : 'rgba(13,110,79,.12)'}
  const warn = {color: dark ? '#ffd07d' : '#9a6204', bg: dark ? 'rgba(255,192,90,.15)' : 'rgba(255,194,88,.18)'}
  const danger = {color: dark ? '#ff9aa0' : '#b51f2f', bg: dark ? 'rgba(255,111,118,.16)' : 'rgba(232,87,104,.14)'}
  const neutral = {color: dark ? '#d5ddd9' : '#355249', bg: dark ? 'rgba(204,220,213,.12)' : 'rgba(53,82,73,.1)'}
  const ship = {color: dark ? '#b8c5ff' : '#3548aa', bg: dark ? 'rgba(120,138,255,.16)' : 'rgba(80,108,243,.15)'}
  const refund = {color: dark ? '#d9b2ff' : '#7040a8', bg: dark ? 'rgba(196,125,255,.16)' : 'rgba(171,99,240,.15)'}

  let tone = neutral
  if (kind === 'order') {
    if (['paid', 'delivered'].includes(status)) tone = ok
    else if (['pending', 'processing'].includes(status)) tone = warn
    else if (['shipped', 'out_for_delivery'].includes(status)) tone = ship
    else if (status === 'cancelled') tone = danger
  } else {
    if (status === 'paid') tone = ok
    else if (status === 'failed') tone = danger
    else if (status === 'refunded') tone = refund
    else if (status === 'partial') tone = warn
  }

  return {
    color: tone.color,
    background: tone.bg,
    border: `1px solid ${dark ? 'rgba(255,255,255,.2)' : 'rgba(13,110,79,.24)'}`,
    display: 'inline-flex',
    padding: '4px 9px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'capitalize',
    whiteSpace: 'nowrap',
  }
}

function Metric({
  icon,
  title,
  value,
  subtitle,
  palette,
}: {
  icon: string
  title: string
  value: string
  subtitle: string
  palette: Palette
}) {
  return (
    <Card
      padding={4}
      radius={2}
      style={{
        background: palette.card,
        border: `1px solid ${palette.border}`,
        boxShadow: palette.shadow,
      }}
    >
      <Stack space={3}>
        <Flex justify="space-between" align="center">
          <Text size={1} style={{color: palette.muted}}>
            {title}
          </Text>
          <Text size={2}>{icon}</Text>
        </Flex>
        <Heading size={2} style={{color: palette.text}}>
          {value}
        </Heading>
        <Text size={1} style={{color: palette.muted}}>
          {subtitle}
        </Text>
      </Stack>
    </Card>
  )
}

export default function StudioDashboard() {
  const client = useClient({apiVersion})
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = window.localStorage.getItem(THEME_KEY)
    return stored === 'dark' || stored === 'light' ? stored : 'dark'
  })
  const [range, setRange] = useState<RevenueRange>('daily')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<DashboardPayload | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [visitorJitter, setVisitorJitter] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const palette = palettes[theme]

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    let mounted = true

    fetchWithRetry(() => client.fetch<DashboardPayload>(DASHBOARD_QUERY), {
      retries: 1,
      retryDelayMs: 550,
    })
      .then((data) => {
        if (!mounted) return
        setPayload(data)
        setLastUpdated(new Date())
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [client, refresh])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = window.setInterval(() => {
      setLoading(true)
      setError(null)
      setRefresh((value) => value + 1)
    }, 120000)
    return () => window.clearInterval(id)
  }, [])

  const metrics = useMemo(() => {
    const products = payload?.products ?? []
    const allOrders = dedupeOrders(payload?.orders ?? []).sort((a, b) => {
      const left = safeDate(a.orderDate)?.getTime() ?? 0
      const right = safeDate(b.orderDate)?.getTime() ?? 0
      return right - left
    })
    const paidOrders = allOrders.filter(isPaidOrder)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1)
    const activeCutoff = new Date(now)
    activeCutoff.setDate(activeCutoff.getDate() - 60)

    const currentMonthOrders = allOrders.filter((order) => {
      const date = safeDate(order.orderDate)
      return Boolean(date && date >= monthStart && date < monthEnd)
    })
    const paidThisMonth = paidOrders.filter((order) => {
      const date = safeDate(order.orderDate)
      return Boolean(date && date >= monthStart && date < monthEnd)
    })
    const paidLastMonth = paidOrders.filter((order) => {
      const date = safeDate(order.orderDate)
      return Boolean(date && date >= prevMonthStart && date < prevMonthEnd)
    })

    const thisMonthRevenue = sumRevenue(paidThisMonth)
    const lastMonthRevenue = sumRevenue(paidLastMonth)
    const revenueGrowth =
      lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : null
    const totalRevenue = sumRevenue(paidOrders)
    const averageOrderValue = paidOrders.length ? totalRevenue / paidOrders.length : 0
    const conversionRate = currentMonthOrders.length
      ? (paidThisMonth.length / currentMonthOrders.length) * 100
      : 0

    const activeCustomers = new Set(
      allOrders
        .filter((order) => {
          const date = safeDate(order.orderDate)
          return Boolean(date && date >= activeCutoff && order.email)
        })
        .map((order) => (order.email || '').toLowerCase())
    ).size

    const abandonedCarts = allOrders.filter((order) => {
      const date = safeDate(order.orderDate)
      if (!date) return false
      const pending = (order.status || '').toLowerCase() === 'pending'
      const unpaid = (order.paymentStatus || '').toLowerCase() !== 'paid'
      return pending && unpaid && now.getTime() - date.getTime() > 1000 * 60 * 60 * 6
    }).length

    const lowStock = products
      .filter((product) => (product.stock ?? 0) <= 5)
      .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
      .slice(0, 8)

    const sales = new Map<string, {name: string; units: number}>()
    for (const order of paidOrders) {
      for (const line of order.products || []) {
        const key = line.productId || line.productName || 'unknown'
        const name = line.productName || 'Unknown product'
        const qty = Math.max(1, line.quantity ?? 1)
        const current = sales.get(key)
        if (!current) sales.set(key, {name, units: qty})
        else current.units += qty
      }
    }
    const topProducts = [...sales.entries()]
      .map(([key, value]) => ({key, ...value}))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5)

    const statusCounts = {
      pending: allOrders.filter((o) => (o.status || '').toLowerCase() === 'pending').length,
      processing: allOrders.filter((o) => (o.status || '').toLowerCase() === 'processing').length,
      shipped: allOrders.filter((o) =>
        ['shipped', 'out_for_delivery'].includes((o.status || '').toLowerCase())
      ).length,
      delivered: allOrders.filter((o) => (o.status || '').toLowerCase() === 'delivered').length,
      cancelled: allOrders.filter((o) => (o.status || '').toLowerCase() === 'cancelled').length,
      failedPayments: allOrders.filter((o) => (o.paymentStatus || '').toLowerCase() === 'failed').length,
    }

    const visitorSeed = Math.max(22, Math.round(activeCustomers * 1.3 + currentMonthOrders.length * 0.8 + 14))

    return {
      allOrders,
      paidOrders,
      thisMonthRevenue,
      lastMonthRevenue,
      revenueGrowth,
      totalRevenue,
      currentMonthOrders: currentMonthOrders.length,
      totalOrders: allOrders.length,
      activeCustomers,
      conversionRate,
      averageOrderValue,
      abandonedCarts,
      lowStock,
      topProducts,
      statusCounts,
      recentOrders: allOrders.slice(0, 8),
      brandsCount: payload?.brandsCount ?? 0,
      categoriesCount: payload?.categoriesCount ?? 0,
      activePromoCount: payload?.activePromoCount ?? 0,
      customerProfilesCount: payload?.customerProfilesCount ?? 0,
      visitorSeed,
    }
  }, [payload])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = window.setInterval(() => {
      setVisitorJitter((value) => {
        const next = value + Math.floor(Math.random() * 7) - 3
        return Math.max(-16, Math.min(16, next))
      })
    }, 4500)
    return () => window.clearInterval(id)
  }, [])

  const series = useMemo(() => buildSeries(metrics.paidOrders, range), [metrics.paidOrders, range])
  const chartPoints = useMemo(() => mapSeriesToChart(series, 680, 240), [series])
  const chartPath = useMemo(() => buildPath(chartPoints), [chartPoints])
  const maxUnits = useMemo(
    () => Math.max(1, ...metrics.topProducts.map((item) => item.units)),
    [metrics.topProducts]
  )
  const visitors = Math.max(8, metrics.visitorSeed + visitorJitter)

  const growthText =
    metrics.revenueGrowth === null
      ? 'No revenue in previous month'
      : `${metrics.revenueGrowth >= 0 ? '+' : ''}${metrics.revenueGrowth.toFixed(1)}% vs last month`
  const statusOverviewCards = [
    {
      key: 'pending',
      label: 'Pending',
      value: metrics.statusCounts.pending,
      valueColor: palette.warning,
      bg: theme === 'dark' ? 'rgba(255,192,90,.12)' : 'rgba(255,194,88,.16)',
      border: theme === 'dark' ? 'rgba(255,192,90,.3)' : 'rgba(173,112,9,.24)',
    },
    {
      key: 'processing',
      label: 'Processing',
      value: metrics.statusCounts.processing,
      valueColor: palette.text,
      bg: theme === 'dark' ? 'rgba(204,220,213,.1)' : 'rgba(53,82,73,.08)',
      border: theme === 'dark' ? 'rgba(204,220,213,.24)' : 'rgba(53,82,73,.2)',
    },
    {
      key: 'shipped',
      label: 'Shipped',
      value: metrics.statusCounts.shipped,
      valueColor: theme === 'dark' ? '#7cf3cc' : '#0d6e4f',
      bg: theme === 'dark' ? 'rgba(124,243,204,.11)' : 'rgba(13,110,79,.1)',
      border: theme === 'dark' ? 'rgba(124,243,204,.28)' : 'rgba(13,110,79,.22)',
    },
    {
      key: 'delivered',
      label: 'Delivered',
      value: metrics.statusCounts.delivered,
      valueColor: palette.success,
      bg: theme === 'dark' ? 'rgba(39,199,139,.12)' : 'rgba(13,110,79,.14)',
      border: theme === 'dark' ? 'rgba(39,199,139,.3)' : 'rgba(13,110,79,.24)',
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      value: metrics.statusCounts.cancelled,
      valueColor: palette.danger,
      bg: theme === 'dark' ? 'rgba(255,111,118,.12)' : 'rgba(232,87,104,.14)',
      border: theme === 'dark' ? 'rgba(255,111,118,.28)' : 'rgba(232,87,104,.24)',
    },
    {
      key: 'failed-payments',
      label: 'Failed Payments',
      value: metrics.statusCounts.failedPayments,
      valueColor: palette.danger,
      bg: theme === 'dark' ? 'rgba(255,111,118,.1)' : 'rgba(232,87,104,.12)',
      border: theme === 'dark' ? 'rgba(255,111,118,.24)' : 'rgba(232,87,104,.2)',
    },
  ]

  const triggerReload = () => {
    setLoading(true)
    setError(null)
    setRefresh((value) => value + 1)
  }

  const exportCsv = () => {
    if (!metrics.allOrders.length) return
    const header = [
      'Order Number',
      'Customer Name',
      'Email',
      'Order Date',
      'Items Count',
      'Total',
      'Order Status',
      'Payment Status',
      'Payment Method',
    ]
    const lines = metrics.allOrders.map((order) =>
      [
        order.orderNumber || '',
        order.customerName || '',
        order.email || '',
        order.orderDate || '',
        String(order.itemsCount ?? order.products?.length ?? 0),
        String(order.totalPrice ?? 0),
        order.status || '',
        order.paymentStatus || '',
        order.paymentMethod || '',
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    )
    const csv = [header.map((value) => `"${value}"`).join(','), ...lines].join('\n')
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `zayna-orders-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const shellStyle: CSSProperties = {
    minHeight: 'calc(100vh - 120px)',
    padding: 22,
    borderRadius: 18,
    background: palette.background,
    color: palette.text,
    border: `1px solid ${palette.border}`,
    boxShadow: palette.shadow,
  }

  return (
    <div style={shellStyle}>
      <style>{DASHBOARD_CSS}</style>
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Stack space={2}>
            <Heading size={2} style={{color: palette.text}}>
              Zayna Commerce Command Center
            </Heading>
            <Text size={1} style={{color: palette.muted}}>
              New dashboard experience focused on revenue, operations, and stock health.
            </Text>
            <Text size={1} style={{color: palette.muted}}>
              {lastUpdated
                ? `Last sync: ${lastUpdated.toLocaleDateString('fr-MA')} ${lastUpdated.toLocaleTimeString('fr-MA')}`
                : 'Last sync: --'}
            </Text>
          </Stack>
          <Flex gap={2}>
            <Button
              mode="ghost"
              tone="primary"
              text={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
            />
            <Button mode="ghost" tone="primary" text="Refresh" onClick={triggerReload} />
            <Button mode="ghost" tone="primary" text="Export CSV" onClick={exportCsv} />
          </Flex>
        </Flex>

        {loading ? (
          <Grid columns={[1, 2, 3]} gap={3}>
            {Array.from({length: 6}).map((_, index) => (
              <Card
                key={`skeleton-${index}`}
                padding={4}
                radius={2}
                style={{background: palette.card, border: `1px solid ${palette.border}`}}
              >
                <Stack space={3}>
                  <div className="zayna-skeleton" style={{height: 14, width: '45%'}} />
                  <div className="zayna-skeleton" style={{height: 28, width: '60%'}} />
                  <div className="zayna-skeleton" style={{height: 11, width: '35%'}} />
                </Stack>
              </Card>
            ))}
          </Grid>
        ) : null}

        {error ? (
          <Card padding={4} radius={2} tone="critical">
            <Stack space={3}>
              <Text size={1}>Error loading dashboard: {error}</Text>
              <Button
                mode="ghost"
                tone="critical"
                text="Retry"
                onClick={triggerReload}
              />
            </Stack>
          </Card>
        ) : null}

        {!loading && !error ? (
          <Stack space={4}>
            <Grid columns={[1, 2, 3]} gap={3}>
              <Metric
                icon="💰"
                title="Revenue This Month"
                value={toCurrency(metrics.thisMonthRevenue)}
                subtitle={growthText}
                palette={palette}
              />
              <Metric
                icon="🧾"
                title="Orders This Month"
                value={`${metrics.currentMonthOrders}`}
                subtitle={`${metrics.totalOrders} total orders`}
                palette={palette}
              />
              <Metric
                icon="👥"
                title="Active Customers (60d)"
                value={`${metrics.activeCustomers}`}
                subtitle={`${metrics.customerProfilesCount} profiles in CRM`}
                palette={palette}
              />
              <Metric
                icon="📈"
                title="Conversion Rate"
                value={`${metrics.conversionRate.toFixed(1)}%`}
                subtitle="Paid orders / monthly orders"
                palette={palette}
              />
              <Metric
                icon="🛍️"
                title="Average Order Value"
                value={toCurrency(metrics.averageOrderValue)}
                subtitle={`${toCurrency(metrics.totalRevenue)} lifetime paid revenue`}
                palette={palette}
              />
              <Metric
                icon="⚡"
                title="Live Visitors (Mock)"
                value={`${visitors}`}
                subtitle={`${metrics.activePromoCount} active promo codes`}
                palette={palette}
              />
            </Grid>

            <Grid columns={[1, 1, 2]} gap={3}>
              <Card
                padding={4}
                radius={2}
                style={{
                  background: 'linear-gradient(135deg, rgba(95,76,228,.3), rgba(35,131,255,.2))',
                  border: `1px solid ${palette.border}`,
                  boxShadow: palette.shadow,
                }}
              >
                <Stack space={4}>
                  <Flex align="center" justify="space-between">
                    <Stack space={2}>
                      <Heading size={1} style={{color: palette.text}}>
                        Revenue Pulse
                      </Heading>
                      <Text size={1} style={{color: palette.muted}}>
                        Daily, weekly, monthly
                      </Text>
                    </Stack>
                    <Flex gap={2}>
                      {(['daily', 'weekly', 'monthly'] as RevenueRange[]).map((option) => {
                        const active = option === range
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setRange(option)}
                            style={{
                              borderRadius: 999,
                              padding: '6px 10px',
                              fontSize: 11,
                              fontWeight: 600,
                              textTransform: 'capitalize',
                              cursor: 'pointer',
                              background: active ? 'rgba(201,168,76,.2)' : 'transparent',
                              border: `1px solid ${active ? palette.accent : palette.border}`,
                              color: palette.text,
                            }}
                          >
                            {option}
                          </button>
                        )
                      })}
                    </Flex>
                  </Flex>
                  <Card
                    padding={3}
                    radius={2}
                    tone="transparent"
                    style={{background: palette.card, border: `1px solid ${palette.border}`}}
                  >
                    {chartPoints.length ? (
                      <div className="zayna-scroll" style={{overflowX: 'auto'}}>
                        <svg viewBox="0 0 680 240" width="100%" height={240} preserveAspectRatio="none">
                          {[0, 1, 2, 3].map((line) => (
                            <line
                              key={`grid-${line}`}
                              x1={22}
                              y1={22 + line * 49}
                              x2={658}
                              y2={22 + line * 49}
                              stroke={palette.track}
                              strokeDasharray="4 4"
                            />
                          ))}
                          <path d={chartPath} fill="none" stroke={palette.line} strokeWidth={3} strokeLinecap="round" />
                          {chartPoints.map((point) => (
                            <circle
                              key={`${point.label}-${point.value}`}
                              cx={point.x}
                              cy={point.y}
                              r={3.5}
                              fill={palette.accent}
                              stroke={palette.card}
                              strokeWidth={2}
                            />
                          ))}
                        </svg>
                      </div>
                    ) : (
                      <Text size={1} style={{color: palette.muted}}>
                        No paid revenue yet.
                      </Text>
                    )}
                  </Card>
                  <Text size={1} style={{color: palette.muted}}>
                    Total in view: {toCurrency(series.reduce((sum, point) => sum + point.value, 0))}
                  </Text>
                </Stack>
              </Card>

              <Card
                padding={4}
                radius={2}
                style={{
                  background: 'linear-gradient(135deg, rgba(13,110,79,.36), rgba(20,165,170,.2))',
                  border: `1px solid ${palette.border}`,
                  boxShadow: palette.shadow,
                }}
              >
                <Stack space={4}>
                  <Heading size={1} style={{color: palette.text}}>
                    Top Selling Products
                  </Heading>
                  {metrics.topProducts.length ? (
                    metrics.topProducts.map((item) => (
                      <Stack key={item.key} space={2}>
                        <Flex justify="space-between">
                          <Text size={1} style={{color: palette.text}}>
                            {item.name}
                          </Text>
                          <Text size={1} style={{color: palette.muted}}>
                            {item.units} units
                          </Text>
                        </Flex>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 999,
                            overflow: 'hidden',
                            background: palette.track,
                          }}
                        >
                          <div
                            style={{
                              width: `${(item.units / maxUnits) * 100}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #c9a84c 0%, #f3d378 100%)',
                            }}
                          />
                        </div>
                      </Stack>
                    ))
                  ) : (
                    <Text size={1} style={{color: palette.muted}}>
                      No paid order lines available yet.
                    </Text>
                  )}
                </Stack>
              </Card>
            </Grid>

            <Grid columns={[1, 2]} gap={3}>
              <Card
                padding={4}
                radius={2}
                style={{
                  background: 'linear-gradient(135deg, rgba(240,115,40,.22), rgba(222,62,69,.23))',
                  border: `1px solid ${palette.border}`,
                  boxShadow: palette.shadow,
                }}
              >
                <Stack space={4}>
                  <Heading size={1} style={{color: palette.text}}>
                    Alerts
                  </Heading>
                  <Text size={1} style={{color: palette.muted}}>
                    Abandoned carts: {metrics.abandonedCarts}
                  </Text>
                  <Stack space={2}>
                    {metrics.lowStock.length ? (
                      metrics.lowStock.map((product) => (
                        <Card
                          key={product._id}
                          padding={3}
                          radius={2}
                          tone="transparent"
                          style={{background: palette.card, border: `1px solid ${palette.border}`}}
                        >
                          <Flex justify="space-between" align="center">
                            <Stack space={1}>
                              <Text size={1} style={{color: palette.text}}>
                                {product.name || 'Unnamed product'}
                              </Text>
                              <Text size={1} style={{color: palette.muted}}>
                                {(product.categoryTitles && product.categoryTitles[0]) || 'Uncategorized'}
                              </Text>
                            </Stack>
                            <Text
                              size={1}
                              weight="semibold"
                              style={{color: (product.stock ?? 0) <= 2 ? palette.danger : palette.warning}}
                            >
                              {(product.stock ?? 0)} left
                            </Text>
                          </Flex>
                        </Card>
                      ))
                    ) : (
                      <Text size={1} style={{color: palette.muted}}>
                        No low stock products right now.
                      </Text>
                    )}
                  </Stack>
                  <Grid columns={[2, 3]} gap={2} style={{alignItems: 'stretch'}}>
                    {statusOverviewCards.map((item) => (
                      <div key={item.key} className="zayna-status-card">
                        <Card
                          padding={3}
                          radius={2}
                          style={{
                            background: item.bg,
                            border: `1px solid ${item.border}`,
                            boxShadow: palette.shadow,
                            height: '100%',
                          }}
                        >
                          <div className="zayna-status-card-body">
                            <Stack space={2} style={{textAlign: 'center', width: '100%'}}>
                              <Text
                                size={1}
                                className="zayna-status-label"
                                style={{color: palette.muted}}
                              >
                                {item.label}
                              </Text>
                              <Text
                                className="zayna-status-value"
                                style={{color: item.valueColor}}
                              >
                                {item.value}
                              </Text>
                            </Stack>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </Grid>
                </Stack>
              </Card>

              <Card
                padding={4}
                radius={2}
                style={{background: palette.card, border: `1px solid ${palette.border}`, boxShadow: palette.shadow}}
              >
                <Stack space={4}>
                  <Heading size={1} style={{color: palette.text}}>
                    Recent Orders
                  </Heading>
                  {metrics.recentOrders.length ? (
                    <div className="zayna-scroll" style={{overflowX: 'auto'}}>
                      <table style={{width: '100%', borderCollapse: 'collapse', minWidth: 760}}>
                        <thead>
                          <tr>
                            {['Order', 'Customer', 'Date', 'Items', 'Total', 'Delivery', 'Payment'].map((label) => (
                              <th
                                key={label}
                                style={{
                                  textAlign: label === 'Items' || label === 'Total' ? 'right' : 'left',
                                  fontSize: 12,
                                  color: palette.muted,
                                  borderBottom: `1px solid ${palette.border}`,
                                  paddingBottom: 10,
                                }}
                              >
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.recentOrders.map((order, index) => (
                            <tr key={order._id || `${order.orderNumber || 'order'}-${index}`}>
                              <td style={{padding: '10px 0', borderBottom: `1px solid ${palette.border}`, fontSize: 12}}>
                                {order.orderNumber || order._id.slice(0, 8)}
                              </td>
                              <td style={{padding: '10px 0', borderBottom: `1px solid ${palette.border}`, fontSize: 12}}>
                                <Stack space={2}>
                                  <Text size={1} style={{color: palette.text}}>{order.customerName || 'Unknown customer'}</Text>
                                  <Text size={1} style={{color: palette.muted}}>{order.email || '-'}</Text>
                                </Stack>
                              </td>
                              <td style={{padding: '10px 0', borderBottom: `1px solid ${palette.border}`, fontSize: 12, color: palette.muted}}>
                                {safeDate(order.orderDate)?.toLocaleDateString('fr-MA') || '-'}
                              </td>
                              <td style={{padding: '10px 0', borderBottom: `1px solid ${palette.border}`, textAlign: 'right', fontSize: 12}}>
                                {order.itemsCount ?? order.products?.length ?? 0}
                              </td>
                              <td style={{padding: '10px 0', borderBottom: `1px solid ${palette.border}`, textAlign: 'right', fontSize: 12}}>
                                {toCurrency(order.totalPrice ?? 0)}
                              </td>
                              <td style={{padding: '10px 0', borderBottom: `1px solid ${palette.border}`}}>
                                <span style={statusStyle(order.status, theme, 'order')}>{titleCaseStatus(order.status)}</span>
                              </td>
                              <td style={{padding: '10px 0', borderBottom: `1px solid ${palette.border}`}}>
                                <span style={statusStyle(order.paymentStatus, theme, 'payment')}>
                                  {titleCaseStatus(order.paymentStatus)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Text size={1} style={{color: palette.muted}}>
                      No orders found.
                    </Text>
                  )}
                </Stack>
              </Card>
            </Grid>
          </Stack>
        ) : null}
      </Stack>
    </div>
  )
}
