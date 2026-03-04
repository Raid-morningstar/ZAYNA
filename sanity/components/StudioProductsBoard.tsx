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
  getInitialTheme,
  getShellStyle,
  studioPalettes,
  toStatusLabel,
  type ThemeMode,
} from './studioBoardShared'

type ProductLite = {
  _id: string
  name?: string
  price?: number
  discount?: number
  stock?: number
  status?: string
  isFeatured?: boolean
  updatedAt?: string
  brandTitle?: string
  categories?: string[]
}

const PRODUCTS_QUERY = `*[_type == "product"] | order(_updatedAt desc){
  _id,
  name,
  price,
  discount,
  stock,
  status,
  isFeatured,
  "updatedAt": _updatedAt,
  "brandTitle": brand->title,
  "categories": categories[]->title
}`

const STOCK_FILTERS = ['all', 'in_stock', 'low_stock', 'out_stock'] as const
const STATUS_FILTERS = ['all', 'new', 'hot', 'sale', 'unknown'] as const

export default function StudioProductsBoard() {
  const client = useClient({apiVersion})
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)
  const [products, setProducts] = useState<ProductLite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<(typeof STOCK_FILTERS)[number]>('all')
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const palette = studioPalettes[theme]

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STUDIO_THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    let mounted = true

    fetchWithRetry(() => client.fetch<ProductLite[]>(PRODUCTS_QUERY), {
      retries: 1,
      retryDelayMs: 550,
    })
      .then((data) => {
        if (!mounted) return
        setProducts(data || [])
        setLastUpdated(new Date())
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to load products')
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

  const filteredProducts = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return products.filter((product) => {
      const stock = product.stock ?? 0
      if (stockFilter === 'in_stock' && stock <= 5) return false
      if (stockFilter === 'low_stock' && !(stock > 0 && stock <= 5)) return false
      if (stockFilter === 'out_stock' && stock > 0) return false

      const status = (product.status || '').toLowerCase()
      if (statusFilter !== 'all') {
        if (statusFilter === 'unknown' && status) return false
        if (statusFilter !== 'unknown' && status !== statusFilter) return false
      }

      if (!searchValue) return true
      const targets = [
        product.name,
        product.brandTitle,
        product.status,
        (product.categories || []).join(' '),
      ]
        .map((value) => (value || '').toLowerCase())
        .join(' ')

      return targets.includes(searchValue)
    })
  }, [products, search, statusFilter, stockFilter])

  const metrics = useMemo(() => {
    const totalProducts = products.length
    const featuredProducts = products.filter((product) => product.isFeatured).length
    const lowStock = products.filter((product) => {
      const stock = product.stock ?? 0
      return stock > 0 && stock <= 5
    }).length
    const outOfStock = products.filter((product) => (product.stock ?? 0) <= 0).length
    const onSale = products.filter((product) => (product.discount ?? 0) > 0 || product.status === 'sale').length
    const averagePrice =
      products.length > 0
        ? products.reduce((sum, product) => sum + (product.price ?? 0), 0) / products.length
        : 0

    return {
      totalProducts,
      featuredProducts,
      lowStock,
      outOfStock,
      onSale,
      averagePrice,
    }
  }, [products])

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
              Products Hub
            </Heading>
            <Text size={1} style={{color: palette.muted}}>
              Monitor inventory quality, stock pressure, and product catalog status.
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
                key={`product-skeleton-${index}`}
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
              <Text size={1}>Error loading products: {error}</Text>
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
                title="Total Products"
                value={formatCompact(metrics.totalProducts)}
                subtitle={`${formatCompact(metrics.featuredProducts)} featured`}
                palette={palette}
              />
              <StatCard
                title="Stock Pressure"
                value={`${metrics.lowStock} low / ${metrics.outOfStock} out`}
                subtitle={`${metrics.onSale} products on sale`}
                palette={palette}
              />
              <StatCard
                title="Average Price"
                value={formatCurrency(metrics.averagePrice)}
                subtitle="Based on current catalog prices"
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
                    Product Stream
                  </Heading>
                  <Flex gap={2} style={{flexWrap: 'wrap'}}>
                    <input
                      type="text"
                      placeholder="Search name/brand/category"
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
                      value={stockFilter}
                      onChange={(event) =>
                        setStockFilter(event.target.value as (typeof STOCK_FILTERS)[number])
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
                      {STOCK_FILTERS.map((value) => (
                        <option key={value} value={value}>
                          {toStatusLabel(value)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(event.target.value as (typeof STATUS_FILTERS)[number])
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
                      {STATUS_FILTERS.map((value) => (
                        <option key={value} value={value}>
                          {toStatusLabel(value)}
                        </option>
                      ))}
                    </select>
                  </Flex>
                </Flex>

                <Text size={1} style={{color: palette.muted}}>
                  Showing {filteredProducts.length} of {products.length} products
                </Text>

                {filteredProducts.length ? (
                  <div className="zayna-scroll" style={{overflowX: 'auto'}}>
                    <table style={{width: '100%', borderCollapse: 'collapse', minWidth: 980}}>
                      <thead>
                        <tr>
                          {[
                            'Product',
                            'Category',
                            'Brand',
                            'Price',
                            'Stock',
                            'Status',
                            'Updated',
                          ].map((label) => (
                            <th
                              key={label}
                              style={{
                                textAlign: label === 'Price' ? 'right' : 'left',
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
                        {filteredProducts.map((product) => {
                          const price = product.price ?? 0
                          const discount = product.discount ?? 0
                          const finalPrice = Math.max(0, price - discount)
                          const stock = product.stock ?? 0
                          const stockPercent = Math.max(0, Math.min(100, stock))

                          return (
                            <tr key={product._id}>
                              <td
                                style={{
                                  padding: '11px 0',
                                  borderBottom: `1px solid ${palette.border}`,
                                  fontSize: 12,
                                }}
                              >
                                <Stack space={2}>
                                  <Text size={1} style={{color: palette.text}}>
                                    {product.name || 'Unnamed product'}
                                  </Text>
                                  {product.isFeatured ? (
                                    <Text size={1} style={{color: palette.accent}}>
                                      Featured
                                    </Text>
                                  ) : (
                                    <Text size={1} style={{color: palette.muted}}>
                                      Standard
                                    </Text>
                                  )}
                                </Stack>
                              </td>
                              <td
                                style={{
                                  padding: '11px 0',
                                  borderBottom: `1px solid ${palette.border}`,
                                  fontSize: 12,
                                  color: palette.muted,
                                }}
                              >
                                {(product.categories || []).slice(0, 2).join(', ') || '-'}
                              </td>
                              <td
                                style={{
                                  padding: '11px 0',
                                  borderBottom: `1px solid ${palette.border}`,
                                  fontSize: 12,
                                  color: palette.muted,
                                }}
                              >
                                {product.brandTitle || '-'}
                              </td>
                              <td
                                style={{
                                  padding: '11px 0',
                                  textAlign: 'right',
                                  borderBottom: `1px solid ${palette.border}`,
                                  fontSize: 12,
                                }}
                              >
                                <Stack space={1}>
                                  <Text size={1} style={{color: palette.text}}>
                                    {formatCurrency(finalPrice)}
                                  </Text>
                                  {discount > 0 ? (
                                    <Text size={1} style={{color: palette.muted}}>
                                      -{formatCurrency(discount)}
                                    </Text>
                                  ) : null}
                                </Stack>
                              </td>
                              <td
                                style={{
                                  padding: '11px 0',
                                  borderBottom: `1px solid ${palette.border}`,
                                  fontSize: 12,
                                }}
                              >
                                <Stack space={2}>
                                  <Text size={1} style={{color: palette.text}}>
                                    {stock}
                                  </Text>
                                  <div
                                    style={{
                                      width: 120,
                                      height: 6,
                                      borderRadius: 999,
                                      background: palette.track,
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${stockPercent}%`,
                                        height: '100%',
                                        background:
                                          stock <= 2
                                            ? palette.danger
                                            : stock <= 5
                                              ? palette.warning
                                              : palette.success,
                                      }}
                                    />
                                  </div>
                                </Stack>
                              </td>
                              <td
                                style={{
                                  padding: '11px 0',
                                  borderBottom: `1px solid ${palette.border}`,
                                  fontSize: 12,
                                  color: palette.muted,
                                }}
                              >
                                {toStatusLabel(product.status || 'unknown')}
                              </td>
                              <td
                                style={{
                                  padding: '11px 0',
                                  borderBottom: `1px solid ${palette.border}`,
                                  fontSize: 12,
                                  color: palette.muted,
                                }}
                              >
                                {formatDate(product.updatedAt)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Text size={1} style={{color: palette.muted}}>
                    No products match the current filters.
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
