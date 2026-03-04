import {Card, Flex, Grid, Heading, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {useEffect, useMemo, useState} from 'react'
import {apiVersion} from '../env'
import {fetchWithRetry} from '../lib/fetchWithRetry'
import {
  STUDIO_BOARD_CSS,
  STUDIO_THEME_KEY,
  HeaderActions,
  StatCard,
  formatCompact,
  formatCurrency,
  formatDate,
  getBadgeStyle,
  getInitialTheme,
  getShellStyle,
  parseDate,
  studioPalettes,
  toStatusLabel,
  type ThemeMode,
} from './studioBoardShared'

type CustomerProfile = {
  _id: string
  fullName?: string
  email?: string
  clerkUserId?: string
  loyaltyTier?: string
  loyaltyPoints?: number
  installmentsEligible?: boolean
  updatedAt?: string
}

type OrderLite = {
  email?: string
  clerkUserId?: string
  totalPrice?: number
  orderDate?: string
  paymentStatus?: string
  status?: string
}

type Payload = {
  profiles: CustomerProfile[]
  orders: OrderLite[]
}

type Segment = 'vip' | 'regular' | 'new' | 'inactive'

const CUSTOMERS_QUERY = `{
  "profiles": *[_type == "customerProfile"] | order(_updatedAt desc){
    _id,
    fullName,
    email,
    clerkUserId,
    loyaltyTier,
    loyaltyPoints,
    installmentsEligible,
    "updatedAt": _updatedAt
  },
  "orders": *[_type == "order"]{
    email,
    clerkUserId,
    totalPrice,
    orderDate,
    paymentStatus,
    status
  }
}`

const SEGMENT_FILTERS = ['all', 'vip', 'regular', 'new', 'inactive'] as const

function isPaidOrder(order: OrderLite) {
  const payment = (order.paymentStatus || '').toLowerCase()
  const status = (order.status || '').toLowerCase()
  return payment === 'paid' || status === 'paid' || status === 'delivered'
}

function computeSegment(totalSpent: number, ordersCount: number, lastOrderDate?: string): Segment {
  if (totalSpent >= 5000) return 'vip'
  if (ordersCount <= 1) return 'new'
  const lastDate = parseDate(lastOrderDate)
  if (lastDate) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)
    if (lastDate < cutoff) return 'inactive'
  }
  return 'regular'
}

export default function StudioCustomersBoard() {
  const client = useClient({apiVersion})
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)
  const [payload, setPayload] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [search, setSearch] = useState('')
  const [segmentFilter, setSegmentFilter] = useState<(typeof SEGMENT_FILTERS)[number]>('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const palette = studioPalettes[theme]

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STUDIO_THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    let mounted = true

    fetchWithRetry(() => client.fetch<Payload>(CUSTOMERS_QUERY), {
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
        setError(err instanceof Error ? err.message : 'Failed to load customers')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [client, refreshTick])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const intervalId = window.setInterval(() => {
      setLoading(true)
      setError(null)
      setRefreshTick((value) => value + 1)
    }, 120000)
    return () => window.clearInterval(intervalId)
  }, [])

  const customerRows = useMemo(() => {
    const profiles = payload?.profiles ?? []
    const orders = payload?.orders ?? []

    const byEmail = new Map<string, OrderLite[]>()
    const byUserId = new Map<string, OrderLite[]>()

    for (const order of orders) {
      const email = (order.email || '').toLowerCase()
      const userId = order.clerkUserId || ''
      if (email) {
        const current = byEmail.get(email) || []
        current.push(order)
        byEmail.set(email, current)
      }
      if (userId) {
        const current = byUserId.get(userId) || []
        current.push(order)
        byUserId.set(userId, current)
      }
    }

    return profiles.map((profile) => {
      const matches = new Set<OrderLite>()
      const email = (profile.email || '').toLowerCase()
      if (email) {
        for (const order of byEmail.get(email) || []) matches.add(order)
      }
      if (profile.clerkUserId) {
        for (const order of byUserId.get(profile.clerkUserId) || []) matches.add(order)
      }

      const matchedOrders = [...matches]
      const paidOrders = matchedOrders.filter(isPaidOrder)
      const totalSpent = paidOrders.reduce((sum, order) => sum + (order.totalPrice ?? 0), 0)
      const lastOrderDate = matchedOrders
        .map((order) => order.orderDate)
        .filter(Boolean)
        .sort((left, right) => {
          const leftDate = parseDate(left)?.getTime() ?? 0
          const rightDate = parseDate(right)?.getTime() ?? 0
          return rightDate - leftDate
        })[0]

      return {
        profile,
        ordersCount: matchedOrders.length,
        paidOrdersCount: paidOrders.length,
        totalSpent,
        lastOrderDate,
        segment: computeSegment(totalSpent, matchedOrders.length, lastOrderDate),
      }
    })
  }, [payload])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return customerRows.filter((row) => {
      if (segmentFilter !== 'all' && row.segment !== segmentFilter) return false
      if (!query) return true

      const targets = [
        row.profile.fullName,
        row.profile.email,
        row.profile.clerkUserId,
        row.profile.loyaltyTier,
        row.segment,
      ]
        .map((value) => (value || '').toLowerCase())
        .join(' ')

      return targets.includes(query)
    })
  }, [customerRows, search, segmentFilter])

  const metrics = useMemo(() => {
    const totalProfiles = customerRows.length
    const vipCount = customerRows.filter((row) => row.segment === 'vip').length
    const regularCount = customerRows.filter((row) => row.segment === 'regular').length
    const inactiveCount = customerRows.filter((row) => row.segment === 'inactive').length
    const installmentsCount = customerRows.filter((row) => row.profile.installmentsEligible).length
    const averagePoints =
      customerRows.length > 0
        ? customerRows.reduce((sum, row) => sum + (row.profile.loyaltyPoints ?? 0), 0) / customerRows.length
        : 0
    const totalRevenue = customerRows.reduce((sum, row) => sum + row.totalSpent, 0)

    return {
      totalProfiles,
      vipCount,
      regularCount,
      inactiveCount,
      installmentsCount,
      averagePoints,
      totalRevenue,
    }
  }, [customerRows])

  const triggerReload = () => {
    setLoading(true)
    setError(null)
    setRefreshTick((value) => value + 1)
  }

  return (
    <div style={getShellStyle(palette)}>
      <style>{STUDIO_BOARD_CSS}</style>
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Stack space={2}>
            <Heading size={2} style={{color: palette.text}}>
              Customers Hub
            </Heading>
            <Text size={1} style={{color: palette.muted}}>
              Segment customer value, loyalty profile health, and payment eligibility.
            </Text>
            <Text size={1} style={{color: palette.muted}}>
              {lastUpdated
                ? `Last sync: ${lastUpdated.toLocaleDateString('fr-MA')} ${lastUpdated.toLocaleTimeString('fr-MA')}`
                : 'Last sync: --'}
            </Text>
          </Stack>
          <HeaderActions
            theme={theme}
            onThemeToggle={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
            onRefresh={triggerReload}
          />
        </Flex>

        {loading ? (
          <Grid columns={[1, 2, 3]} gap={3}>
            {Array.from({length: 6}).map((_, index) => (
              <Card
                key={`customer-skeleton-${index}`}
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
              <Text size={1}>Error loading customers: {error}</Text>
              <Flex>
                <button
                  type="button"
                  onClick={triggerReload}
                  style={{
                    borderRadius: 8,
                    border: `1px solid ${palette.border}`,
                    background: 'transparent',
                    color: palette.text,
                    padding: '6px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </Flex>
            </Stack>
          </Card>
        ) : null}

        {!loading && !error ? (
          <Stack space={4}>
            <Grid columns={[1, 2, 3]} gap={3}>
              <StatCard
                title="Customer Profiles"
                value={formatCompact(metrics.totalProfiles)}
                subtitle={`${formatCompact(metrics.installmentsCount)} installments eligible`}
                palette={palette}
              />
              <StatCard
                title="Segment Spread"
                value={`${metrics.vipCount} VIP / ${metrics.regularCount} regular`}
                subtitle={`${metrics.inactiveCount} inactive`}
                palette={palette}
              />
              <StatCard
                title="Value Snapshot"
                value={formatCurrency(metrics.totalRevenue)}
                subtitle={`${Math.round(metrics.averagePoints)} avg loyalty points`}
                palette={palette}
              />
            </Grid>

            <Card
              padding={4}
              radius={2}
              style={{
                background: palette.card,
                border: `1px solid ${palette.border}`,
                boxShadow: palette.shadow,
              }}
            >
              <Stack space={4}>
                <Flex
                  align={['stretch', 'stretch', 'center']}
                  justify="space-between"
                  gap={3}
                  style={{flexWrap: 'wrap'}}
                >
                  <Heading size={1} style={{color: palette.text}}>
                    Customer Stream
                  </Heading>
                  <Flex gap={2} style={{flexWrap: 'wrap'}}>
                    <input
                      type="text"
                      placeholder="Search name/email/id"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      style={{
                        minWidth: 220,
                        borderRadius: 8,
                        border: `1px solid ${palette.border}`,
                        background: palette.card,
                        color: palette.text,
                        padding: '8px 10px',
                        outline: 'none',
                      }}
                    />
                    <select
                      value={segmentFilter}
                      onChange={(event) =>
                        setSegmentFilter(event.target.value as (typeof SEGMENT_FILTERS)[number])
                      }
                      style={{
                        borderRadius: 8,
                        border: `1px solid ${palette.border}`,
                        background: palette.card,
                        color: palette.text,
                        padding: '8px 10px',
                        outline: 'none',
                      }}
                    >
                      {SEGMENT_FILTERS.map((segment) => (
                        <option key={segment} value={segment}>
                          {toStatusLabel(segment)}
                        </option>
                      ))}
                    </select>
                  </Flex>
                </Flex>

                <Text size={1} style={{color: palette.muted}}>
                  Showing {filteredRows.length} of {customerRows.length} customer profiles
                </Text>

                {filteredRows.length ? (
                  <div className="zayna-scroll" style={{overflowX: 'auto'}}>
                    <table style={{width: '100%', borderCollapse: 'collapse', minWidth: 940}}>
                      <thead>
                        <tr>
                          {[
                            'Customer',
                            'Segment',
                            'Orders',
                            'Paid Orders',
                            'Total Spent',
                            'Last Order',
                            'Loyalty Tier',
                            'Points',
                            'Installments',
                          ].map((label) => (
                            <th
                              key={label}
                              style={{
                                textAlign:
                                  label === 'Orders' ||
                                  label === 'Paid Orders' ||
                                  label === 'Total Spent' ||
                                  label === 'Points'
                                    ? 'right'
                                    : 'left',
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
                        {filteredRows.map((row) => (
                          <tr key={row.profile._id}>
                            <td
                              style={{
                                padding: '11px 0',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                              }}
                            >
                              <Stack space={2}>
                                <Text size={1} style={{color: palette.text}}>
                                  {row.profile.fullName || 'Unknown customer'}
                                </Text>
                                <Text size={1} style={{color: palette.muted}}>
                                  {row.profile.email || row.profile.clerkUserId || '-'}
                                </Text>
                              </Stack>
                            </td>
                            <td style={{padding: '11px 0', borderBottom: `1px solid ${palette.border}`}}>
                              <span style={getBadgeStyle(row.segment, theme, 'segment')}>
                                {toStatusLabel(row.segment)}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: '11px 0',
                                textAlign: 'right',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                              }}
                            >
                              {row.ordersCount}
                            </td>
                            <td
                              style={{
                                padding: '11px 0',
                                textAlign: 'right',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                              }}
                            >
                              {row.paidOrdersCount}
                            </td>
                            <td
                              style={{
                                padding: '11px 0',
                                textAlign: 'right',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {formatCurrency(row.totalSpent)}
                            </td>
                            <td
                              style={{
                                padding: '11px 0',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                                color: palette.muted,
                              }}
                            >
                              {formatDate(row.lastOrderDate)}
                            </td>
                            <td
                              style={{
                                padding: '11px 0',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                                color: palette.muted,
                              }}
                            >
                              {toStatusLabel(row.profile.loyaltyTier || 'bronze')}
                            </td>
                            <td
                              style={{
                                padding: '11px 0',
                                textAlign: 'right',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                              }}
                            >
                              {row.profile.loyaltyPoints ?? 0}
                            </td>
                            <td
                              style={{
                                padding: '11px 0',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                                color: palette.muted,
                              }}
                            >
                              {row.profile.installmentsEligible ? 'Yes' : 'No'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Text size={1} style={{color: palette.muted}}>
                    No customers match the current filters.
                  </Text>
                )}
              </Stack>
            </Card>
          </Stack>
        ) : null}
      </Stack>
    </div>
  )
}
