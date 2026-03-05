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
  products?: OrderProductLine[]
}

type OrderProductLine = {
  quantity?: number
  productId?: string
  productName?: string
  productStock?: number
}

const ORDERS_QUERY = `*[_type == "order"] | order(orderDate desc){
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
    "productName": product->name,
    "productStock": product->stock
  }
}`

const ORDER_FILTERS = [
  'all',
  'pending',
  'processing',
  'paid',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const

const PAYMENT_FILTERS = ['all', 'pending', 'partial', 'paid', 'failed', 'refunded'] as const

function isPaid(order: OrderLite) {
  const payment = (order.paymentStatus || '').toLowerCase()
  const status = (order.status || '').toLowerCase()
  return payment === 'paid' || status === 'paid' || status === 'delivered'
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
    const oldDate = parseDate(existing.orderDate)?.getTime() ?? 0
    const newDate = parseDate(order.orderDate)?.getTime() ?? 0
    if (newDate >= oldDate) byKey.set(key, order)
  }
  return [...byKey.values()]
}

function getOrderUnits(order: OrderLite) {
  const lines = order.products || []
  if (!lines.length) return order.itemsCount ?? 0
  return lines.reduce((sum, line) => sum + Math.max(1, line.quantity ?? 1), 0)
}

export default function StudioOrdersBoard() {
  const client = useClient({apiVersion})
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)
  const [orders, setOrders] = useState<OrderLite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof ORDER_FILTERS)[number]>('all')
  const [paymentFilter, setPaymentFilter] = useState<(typeof PAYMENT_FILTERS)[number]>('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const palette = studioPalettes[theme]

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STUDIO_THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    let mounted = true

    fetchWithRetry(() => client.fetch<OrderLite[]>(ORDERS_QUERY), {
      retries: 1,
      retryDelayMs: 550,
    })
      .then((data) => {
        if (!mounted) return
        setOrders(dedupeOrders(data || []))
        setLastUpdated(new Date())
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to load orders')
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

  const filteredOrders = useMemo(() => {
    const searchValue = search.trim().toLowerCase()
    return orders.filter((order) => {
      if (statusFilter !== 'all' && (order.status || '').toLowerCase() !== statusFilter) return false
      if (paymentFilter !== 'all' && (order.paymentStatus || '').toLowerCase() !== paymentFilter) return false
      if (!searchValue) return true

      const targets = [
        order.orderNumber,
        order.customerName,
        order.email,
        order.paymentMethod,
      ]
        .map((value) => (value || '').toLowerCase())
        .join(' ')

      return targets.includes(searchValue)
    })
  }, [orders, paymentFilter, search, statusFilter])

  const metrics = useMemo(() => {
    const paidOrders = orders.filter(isPaid)
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.totalPrice ?? 0), 0)
    const totalUnitsOrdered = orders.reduce((sum, order) => sum + getOrderUnits(order), 0)
    const pendingOrders = orders.filter((order) => (order.status || '').toLowerCase() === 'pending').length
    const deliveredOrders = orders.filter((order) => (order.status || '').toLowerCase() === 'delivered').length
    const failedPayments = orders.filter((order) => (order.paymentStatus || '').toLowerCase() === 'failed').length
    const averageOrderValue = paidOrders.length ? totalRevenue / paidOrders.length : 0

    return {
      totalOrders: orders.length,
      totalUnitsOrdered,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
      failedPayments,
      averageOrderValue,
    }
  }, [orders])

  const triggerReload = () => {
    setLoading(true)
    setError(null)
    setRefreshTick((value) => value + 1)
  }

  return (
    <div
      style={{
        ...getShellStyle(palette),
        minHeight: 'calc(100vh - 96px)',
        padding: 26,
      }}
    >
      <style>{STUDIO_BOARD_CSS}</style>
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Stack space={2}>
            <Heading size={2} style={{color: palette.text}}>
              Orders Hub
            </Heading>
            <Text size={1} style={{color: palette.muted}}>
              Track order flow, payment health, and delivery performance.
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
                key={`order-skeleton-${index}`}
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
              <Text size={1}>Error loading orders: {error}</Text>
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
                title="Total Orders"
                value={formatCompact(metrics.totalOrders)}
                subtitle={`${formatCompact(metrics.totalUnitsOrdered)} units ordered`}
                palette={palette}
              />
              <StatCard
                title="Paid Revenue"
                value={formatCurrency(metrics.totalRevenue)}
                subtitle={`${formatCurrency(metrics.averageOrderValue)} average order`}
                palette={palette}
              />
              <StatCard
                title="Pending Queue"
                value={`${metrics.pendingOrders}`}
                subtitle={`${metrics.failedPayments} failed payments`}
                palette={palette}
              />
            </Grid>

            <Card
              padding={5}
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
                    Order Stream
                  </Heading>
                  <Flex gap={2} style={{flexWrap: 'wrap'}}>
                    <input
                      type="text"
                      placeholder="Search order/customer/email"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      style={{
                        minWidth: 260,
                        borderRadius: 8,
                        border: `1px solid ${palette.border}`,
                        background: palette.card,
                        color: palette.text,
                        padding: '8px 10px',
                        outline: 'none',
                      }}
                    />
                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(event.target.value as (typeof ORDER_FILTERS)[number])
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
                      {ORDER_FILTERS.map((status) => (
                        <option key={status} value={status}>
                          {toStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={paymentFilter}
                      onChange={(event) =>
                        setPaymentFilter(event.target.value as (typeof PAYMENT_FILTERS)[number])
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
                      {PAYMENT_FILTERS.map((status) => (
                        <option key={status} value={status}>
                          {toStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </Flex>
                </Flex>

                <Text size={1} style={{color: palette.muted}}>
                  Showing {filteredOrders.length} of {orders.length} orders
                </Text>

                {filteredOrders.length ? (
                  <div className="zayna-scroll" style={{overflowX: 'auto'}}>
                    <table style={{width: '100%', borderCollapse: 'collapse', minWidth: 1260}}>
                      <thead>
                        <tr>
                          {[
                            'Order',
                            'Customer',
                            'Date',
                            'Items',
                            'Qty',
                            'Products / Stock',
                            'Total',
                            'Payment Method',
                            'Delivery',
                            'Payment',
                          ].map((label) => (
                            <th
                              key={label}
                              style={{
                                textAlign:
                                  ['Items', 'Qty', 'Total'].includes(label) ? 'right' : 'left',
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
                        {filteredOrders.map((order, index) => (
                          <tr key={order._id || `${order.orderNumber || 'order'}-${index}`}>
                            <td
                              style={{
                                padding: '14px 0',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                              }}
                            >
                              {order.orderNumber || order._id.slice(0, 8)}
                            </td>
                            <td
                              style={{
                                padding: '14px 0',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                              }}
                            >
                              <Stack space={2}>
                                <Text size={1} style={{color: palette.text}}>
                                  {order.customerName || 'Unknown customer'}
                                </Text>
                                <Text size={1} style={{color: palette.muted}}>
                                  {order.email || '-'}
                                </Text>
                              </Stack>
                            </td>
                            <td
                              style={{
                                padding: '14px 0',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                                color: palette.muted,
                              }}
                            >
                              {formatDate(order.orderDate)}
                            </td>
                            <td
                              style={{
                                padding: '14px 0',
                                textAlign: 'right',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                              }}
                            >
                              {order.itemsCount ?? 0}
                            </td>
                            <td
                              style={{
                                padding: '14px 0',
                                textAlign: 'right',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {getOrderUnits(order)}
                            </td>
                            <td
                              style={{
                                padding: '14px 0',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                                minWidth: 280,
                              }}
                            >
                              {order.products?.length ? (
                                <Stack space={2}>
                                  {order.products.slice(0, 2).map((line, lineIndex) => {
                                    const lineStock = line.productStock
                                    const stockColor =
                                      typeof lineStock !== 'number'
                                        ? palette.muted
                                        : lineStock <= 0
                                          ? palette.danger
                                          : lineStock <= 5
                                            ? palette.warning
                                            : palette.success

                                    return (
                                      <Text
                                        key={`${line.productId || line.productName || 'line'}-${lineIndex}`}
                                        size={1}
                                        style={{color: palette.text}}
                                      >
                                        {`${Math.max(1, line.quantity ?? 1)}x ${line.productName || 'Unknown product'} `}
                                        <span style={{color: stockColor}}>
                                          {typeof lineStock === 'number'
                                            ? `(stock ${lineStock})`
                                            : '(stock --)'}
                                        </span>
                                      </Text>
                                    )
                                  })}
                                  {order.products.length > 2 ? (
                                    <Text size={1} style={{color: palette.muted}}>
                                      +{order.products.length - 2} more line(s)
                                    </Text>
                                  ) : null}
                                </Stack>
                              ) : (
                                <Text size={1} style={{color: palette.muted}}>
                                  -
                                </Text>
                              )}
                            </td>
                            <td
                              style={{
                                padding: '14px 0',
                                textAlign: 'right',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {formatCurrency(order.totalPrice ?? 0)}
                            </td>
                            <td
                              style={{
                                padding: '14px 0',
                                borderBottom: `1px solid ${palette.border}`,
                                fontSize: 12,
                                color: palette.muted,
                              }}
                            >
                              {toStatusLabel(order.paymentMethod || '-')}
                            </td>
                            <td style={{padding: '14px 0', borderBottom: `1px solid ${palette.border}`}}>
                              <span style={getBadgeStyle(order.status, theme, 'order')}>
                                {toStatusLabel(order.status)}
                              </span>
                            </td>
                            <td style={{padding: '14px 0', borderBottom: `1px solid ${palette.border}`}}>
                              <span style={getBadgeStyle(order.paymentStatus, theme, 'payment')}>
                                {toStatusLabel(order.paymentStatus)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Text size={1} style={{color: palette.muted}}>
                    No orders match the current filters.
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
