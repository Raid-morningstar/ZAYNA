import {Button, Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import {type CSSProperties} from 'react'

export type ThemeMode = 'dark' | 'light'
type BadgeKind = 'order' | 'payment' | 'segment'

export type StudioPalette = {
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

export const STUDIO_THEME_KEY = 'zayna_dashboard_theme'

export const studioPalettes: Record<ThemeMode, StudioPalette> = {
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

export const STUDIO_BOARD_CSS = `
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
`

const currencyFormatter = new Intl.NumberFormat('fr-MA', {
  style: 'currency',
  currency: 'MAD',
  maximumFractionDigits: 0,
})

const compactFormatter = new Intl.NumberFormat('fr-MA', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(STUDIO_THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value || 0)
}

export function formatCompact(value: number) {
  return compactFormatter.format(value || 0)
}

export function parseDate(value?: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value?: string) {
  const date = parseDate(value)
  if (!date) return '-'
  return date.toLocaleDateString('fr-MA')
}

export function toStatusLabel(value?: string) {
  if (!value) return 'Unknown'
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getShellStyle(palette: StudioPalette): CSSProperties {
  return {
    minHeight: 'calc(100vh - 120px)',
    padding: 22,
    borderRadius: 18,
    background: palette.background,
    color: palette.text,
    border: `1px solid ${palette.border}`,
    boxShadow: palette.shadow,
  }
}

export function getBadgeStyle(
  value: string | undefined,
  mode: ThemeMode,
  kind: BadgeKind
): CSSProperties {
  const status = (value || '').toLowerCase()
  const dark = mode === 'dark'
  const ok = {color: dark ? '#8bf1cb' : '#0d6e4f', bg: dark ? 'rgba(39,199,139,.15)' : 'rgba(13,110,79,.12)'}
  const warn = {color: dark ? '#ffd07d' : '#9a6204', bg: dark ? 'rgba(255,192,90,.15)' : 'rgba(255,194,88,.18)'}
  const danger = {color: dark ? '#ff9aa0' : '#b51f2f', bg: dark ? 'rgba(255,111,118,.16)' : 'rgba(232,87,104,.14)'}
  const neutral = {color: dark ? '#d5ddd9' : '#355249', bg: dark ? 'rgba(204,220,213,.12)' : 'rgba(53,82,73,.1)'}
  const info = {color: dark ? '#b8c5ff' : '#3548aa', bg: dark ? 'rgba(120,138,255,.16)' : 'rgba(80,108,243,.15)'}
  const violet = {color: dark ? '#d9b2ff' : '#7040a8', bg: dark ? 'rgba(196,125,255,.16)' : 'rgba(171,99,240,.15)'}

  let tone = neutral

  if (kind === 'order') {
    if (['paid', 'delivered'].includes(status)) tone = ok
    else if (['pending', 'processing'].includes(status)) tone = warn
    else if (['shipped', 'out_for_delivery'].includes(status)) tone = info
    else if (status === 'cancelled') tone = danger
  }

  if (kind === 'payment') {
    if (status === 'paid') tone = ok
    else if (status === 'failed') tone = danger
    else if (status === 'refunded') tone = violet
    else if (status === 'partial') tone = warn
  }

  if (kind === 'segment') {
    if (status === 'vip') tone = violet
    else if (status === 'regular') tone = info
    else if (status === 'new') tone = ok
    else if (status === 'inactive') tone = danger
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

export function StatCard({
  title,
  value,
  subtitle,
  palette,
}: {
  title: string
  value: string
  subtitle: string
  palette: StudioPalette
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
        <Text size={1} style={{color: palette.muted}}>
          {title}
        </Text>
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

export function HeaderActions({
  theme,
  onThemeToggle,
  onRefresh,
}: {
  theme: ThemeMode
  onThemeToggle: () => void
  onRefresh: () => void
}) {
  return (
    <Flex gap={2}>
      <Button
        mode="ghost"
        tone="primary"
        text={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        onClick={onThemeToggle}
      />
      <Button mode="ghost" tone="primary" text="Refresh" onClick={onRefresh} />
    </Flex>
  )
}
