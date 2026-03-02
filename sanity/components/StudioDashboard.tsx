import {Button, Card, Flex, Grid, Heading, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {useEffect, useMemo, useState} from 'react'
import {apiVersion} from '../env'

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
  address?: {
    phone?: string
    city?: string
    state?: string
    zip?: string
    address?: string
  }
}

type ProductLite = {
  stock?: number
  brandTitle?: string
}

type DashboardPayload = {
  products: ProductLite[]
  orders: OrderLite[]
  brandsCount: number
  categoriesCount: number
  ordersCount: number
  activePromoCount: number
  customerProfilesCount: number
  installmentsEligibleCount: number
}

type MetricCardProps = {
  title: string
  value: string
  subtitle?: string
}

type BarPoint = {
  label: string
  value: number
}

const DASHBOARD_QUERY = `{
  "products": *[_type == "product"]{
    stock,
    "brandTitle": brand->title
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
    address{
      phone,
      city,
      state,
      zip,
      address
    }
  },
  "brandsCount": count(*[_type == "brand"]),
  "categoriesCount": count(*[_type == "category"]),
  "ordersCount": count(*[_type == "order"]),
  "activePromoCount": count(*[_type == "promoCode" && active == true]),
  "customerProfilesCount": count(*[_type == "customerProfile"]),
  "installmentsEligibleCount": count(*[_type == "customerProfile" && installmentsEligible == true])
}`

const currencyFormatter = new Intl.NumberFormat('fr-MA', {
  style: 'currency',
  currency: 'MAD',
  maximumFractionDigits: 0,
})

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function toCurrency(value: number) {
  return currencyFormatter.format(value || 0)
}

function formatDayLabel(input: Date) {
  return `${input.getMonth() + 1}/${input.getDate()}`
}

function formatMonthLabel(input: Date) {
  return input.toLocaleString('en-US', {month: 'short'})
}

function sumOrderRevenue(orders: OrderLite[]) {
  return orders.reduce((total, order) => total + (order.totalPrice ?? 0), 0)
}

function isRevenueOrder(order: OrderLite) {
  if (order.paymentStatus) {
    return order.paymentStatus === 'paid'
  }
  return order.status === 'paid'
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

    const existingTime = existing.orderDate ? new Date(existing.orderDate).getTime() : 0
    const currentTime = order.orderDate ? new Date(order.orderDate).getTime() : 0
    if (currentTime >= existingTime) {
      byKey.set(key, order)
    }
  }
  return [...byKey.values()]
}

function csvEscape(value: string) {
  const escaped = value.replace(/"/g, '""')
  return `"${escaped}"`
}

function buildDailySeries(orders: OrderLite[], days: number): BarPoint[] {
  const now = new Date()
  const result: BarPoint[] = []

  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    const value = orders.reduce((total, order) => {
      if (!order.orderDate) return total
      const date = new Date(order.orderDate)
      if (date >= start && date < end) {
        return total + (order.totalPrice ?? 0)
      }
      return total
    }, 0)
    result.push({label: formatDayLabel(start), value})
  }

  return result
}

function buildMonthlySeries(orders: OrderLite[], months: number): BarPoint[] {
  const now = new Date()
  const result: BarPoint[] = []

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
    const value = orders.reduce((total, order) => {
      if (!order.orderDate) return total
      const date = new Date(order.orderDate)
      if (date >= start && date < end) {
        return total + (order.totalPrice ?? 0)
      }
      return total
    }, 0)
    result.push({label: formatMonthLabel(start), value})
  }

  return result
}

function MetricCard({title, value, subtitle}: MetricCardProps) {
  return (
    <Card padding={4} radius={2} shadow={1} tone="default">
      <Stack space={3}>
        <Text size={1} muted>
          {title}
        </Text>
        <Heading size={3}>{value}</Heading>
        {subtitle ? (
          <Text size={1} muted>
            {subtitle}
          </Text>
        ) : null}
      </Stack>
    </Card>
  )
}

function SimpleBarChart({
  title,
  points,
  emptyText,
}: {
  title: string
  points: BarPoint[]
  emptyText: string
}) {
  const maxValue = useMemo(
    () => points.reduce((max, point) => Math.max(max, point.value), 0),
    [points]
  )

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <Heading size={1}>{title}</Heading>
        {points.length === 0 ? (
          <Text size={1} muted>
            {emptyText}
          </Text>
        ) : (
          <Stack space={3}>
            {points.map((point) => {
              const widthPercent = maxValue > 0 ? (point.value / maxValue) * 100 : 0
              return (
                <Stack key={point.label} space={2}>
                  <Flex justify="space-between">
                    <Text size={1}>{point.label}</Text>
                    <Text size={1} weight="medium">
                      {compactNumber.format(point.value)}
                    </Text>
                  </Flex>
                  <Card
                    radius={2}
                    tone="transparent"
                    style={{
                      backgroundColor: '#e4e7eb',
                      height: '10px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${widthPercent}%`,
                        height: '100%',
                        background:
                          'linear-gradient(90deg, rgb(17, 127, 255) 0%, rgb(35, 197, 255) 100%)',
                        transition: 'width 300ms ease',
                      }}
                    />
                  </Card>
                </Stack>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}

export default function StudioDashboard() {
  const client = useClient({apiVersion})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    client
      .fetch<DashboardPayload>(DASHBOARD_QUERY)
      .then((payload) => {
        if (!isMounted) return
        setData(payload)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        const message = err instanceof Error ? err.message : 'Failed to load dashboard data'
        setError(message)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [client])

  const metrics = useMemo(() => {
    const uniqueOrders = dedupeOrders(data?.orders ?? [])
    const orders = uniqueOrders.filter(isRevenueOrder)
    const products = data?.products ?? []
    const totalIncome = sumOrderRevenue(orders)

    const now = new Date()
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startTomorrow = new Date(startToday)
    startTomorrow.setDate(startTomorrow.getDate() + 1)
    const todayIncome = sumOrderRevenue(
      orders.filter((order) => {
        if (!order.orderDate) return false
        const date = new Date(order.orderDate)
        return date >= startToday && date < startTomorrow
      })
    )

    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const monthIncome = sumOrderRevenue(
      orders.filter((order) => {
        if (!order.orderDate) return false
        const date = new Date(order.orderDate)
        return date >= startMonth && date < startNextMonth
      })
    )

    const outOfStock = products.filter((product) => (product.stock ?? 0) <= 0).length
    const lowStock = products.filter((product) => {
      const stock = product.stock ?? 0
      return stock > 0 && stock <= 5
    }).length

    const brandCounter = new Map<string, number>()
    for (const product of products) {
      const brand = product.brandTitle?.trim() || 'Unbranded'
      brandCounter.set(brand, (brandCounter.get(brand) ?? 0) + 1)
    }
    const topBrands = [...brandCounter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({label: name, value}))

    const latestOrders = [...uniqueOrders]
      .sort((a, b) => {
        const left = a.orderDate ? new Date(a.orderDate).getTime() : 0
        const right = b.orderDate ? new Date(b.orderDate).getTime() : 0
        return right - left
      })
      .slice(0, 6)

    return {
      productsCount: products.length,
      brandsCount: data?.brandsCount ?? 0,
      categoriesCount: data?.categoriesCount ?? 0,
      ordersCount: uniqueOrders.length,
      activePromoCount: data?.activePromoCount ?? 0,
      customerProfilesCount: data?.customerProfilesCount ?? 0,
      installmentsEligibleCount: data?.installmentsEligibleCount ?? 0,
      totalIncome,
      todayIncome,
      monthIncome,
      outOfStock,
      lowStock,
      paidOrders: orders,
      topBrands,
      latestOrders,
      uniqueOrders,
    }
  }, [data])

  const dailyIncome = useMemo(
    () => buildDailySeries(metrics.paidOrders ?? [], 7),
    [metrics.paidOrders]
  )
  const monthlyIncome = useMemo(
    () => buildMonthlySeries(metrics.paidOrders ?? [], 12),
    [metrics.paidOrders]
  )

  const handleResetOrders = async () => {
    if (!window.confirm('Delete ALL orders permanently? This cannot be undone.')) {
      return
    }

    try {
      setActionLoading(true)
      await client.delete({query: '*[_type == "order"]'})
      setData((prev) => {
        if (!prev) return prev
        return {...prev, orders: [], ordersCount: 0}
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete orders'
      setError(message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleExportClients = () => {
    const rows = metrics.uniqueOrders || []
    if (!rows.length) {
      return
    }

    const header = [
      'Order Number',
      'Customer Name',
      'Email',
      'Phone',
      'Address',
      'City',
      'State',
      'Postal Code',
      'Payment Method',
      'Order Status',
      'Payment Status',
      'Total',
      'Order Date',
    ]

    const lines = rows.map((order) =>
      [
        order.orderNumber || '',
        order.customerName || '',
        order.email || '',
        order.address?.phone || '',
        order.address?.address || '',
        order.address?.city || '',
        order.address?.state || '',
        order.address?.zip || '',
        order.paymentMethod || '',
        order.status || '',
        order.paymentStatus || '',
        String(order.totalPrice || 0),
        order.orderDate || '',
      ]
        .map((value) => csvEscape(String(value)))
        .join(',')
    )

    const csv = [header.map(csvEscape).join(','), ...lines].join('\n')
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `clients-orders-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Stack space={4} padding={4}>
      <Flex align="center" justify="space-between">
        <Heading size={2}>Admin Dashboard</Heading>
        <Flex gap={2}>
          <Button
            mode="ghost"
            tone="primary"
            text="Export Clients (CSV)"
            onClick={handleExportClients}
            disabled={actionLoading || !(metrics.uniqueOrders || []).length}
          />
          <Button
            mode="ghost"
            tone="critical"
            text={actionLoading ? 'Resetting...' : 'Delete All Orders'}
            onClick={handleResetOrders}
            disabled={actionLoading}
          />
        </Flex>
      </Flex>
      <Text size={1} muted>
        Project overview for products, brands, orders, and revenue.
      </Text>

      {loading ? (
        <Card padding={4} radius={2} shadow={1}>
          <Text>Loading dashboard...</Text>
        </Card>
      ) : null}

      {error ? (
        <Card padding={4} radius={2} shadow={1} tone="critical">
          <Text size={1}>Error: {error}</Text>
        </Card>
      ) : null}

      {!loading && !error ? (
        <Stack space={4}>
          <Grid columns={[1, 2, 3]} gap={3}>
            <MetricCard title="Total Products" value={`${metrics.productsCount}`} />
            <MetricCard title="Total Brands" value={`${metrics.brandsCount}`} />
            <MetricCard title="Total Categories" value={`${metrics.categoriesCount}`} />
            <MetricCard title="Total Orders" value={`${metrics.ordersCount}`} />
            <MetricCard title="Active Promo Codes" value={`${metrics.activePromoCount}`} />
            <MetricCard
              title="Loyalty Customers"
              value={`${metrics.customerProfilesCount}`}
            />
            <MetricCard
              title="Installments Eligible"
              value={`${metrics.installmentsEligibleCount}`}
            />
            <MetricCard title="Income (Today)" value={toCurrency(metrics.todayIncome)} />
            <MetricCard title="Income (This Month)" value={toCurrency(metrics.monthIncome)} />
            <MetricCard title="Total Income" value={toCurrency(metrics.totalIncome)} />
            <MetricCard title="Low Stock Products" value={`${metrics.lowStock}`} />
            <MetricCard title="Out of Stock" value={`${metrics.outOfStock}`} />
          </Grid>

          <Grid columns={[1, 1, 2]} gap={3}>
            <SimpleBarChart
              title="Daily Income (Last 7 Days)"
              points={dailyIncome}
              emptyText="No revenue data for the last 7 days."
            />
            <SimpleBarChart
              title="Monthly Income (Last 12 Months)"
              points={monthlyIncome}
              emptyText="No revenue data for the last 12 months."
            />
          </Grid>

          <Grid columns={[1, 2]} gap={3}>
            <SimpleBarChart
              title="Top Brands by Product Count"
              points={metrics.topBrands}
              emptyText="No brand/product data yet."
            />

            <Card padding={4} radius={2} shadow={1}>
              <Stack space={4}>
                <Heading size={1}>Recent Orders</Heading>
                {metrics.latestOrders.length === 0 ? (
                  <Text size={1} muted>
                    No orders yet.
                  </Text>
                ) : (
                  <Stack space={3}>
                    {metrics.latestOrders.map((order, index) => (
                      <Card
                        key={order._id || `${order.orderNumber || 'order'}-${index}`}
                        padding={3}
                        radius={2}
                        tone="transparent"
                      >
                        <Flex justify="space-between" align="center">
                          <Stack space={2}>
                            <Text size={1} weight="medium">
                              {order.orderNumber || 'No order number'}
                            </Text>
                            <Text size={1} muted>
                              {order.customerName || 'Unknown customer'}
                            </Text>
                          </Stack>
                          <Stack space={2}>
                            <Text size={1} align="right">
                              {toCurrency(order.totalPrice ?? 0)}
                            </Text>
                            <Text size={1} muted align="right">
                              {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-US') : '-'}
                            </Text>
                          </Stack>
                        </Flex>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Card>
          </Grid>
        </Stack>
      ) : null}
    </Stack>
  )
}
