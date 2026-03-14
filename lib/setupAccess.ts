type HeaderSource = {
  headers: Headers
  url: string
}

function stripPort(value: string): string {
  if (!value) return ''
  if (value.startsWith('[')) {
    const end = value.indexOf(']')
    return end >= 0 ? value.slice(1, end) : value
  }

  const parts = value.split(':')
  return parts.length > 1 ? parts[0] : value
}

function normalizeAddress(value: string | null | undefined): string {
  return stripPort((value || '').trim().toLowerCase())
}

function firstForwardedValue(value: string | null): string {
  return normalizeAddress(value?.split(',')[0])
}

function isPrivateIpv4(value: string): boolean {
  const match = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!match) return false

  const octets = match.slice(1).map(Number)
  if (octets.some((part) => part < 0 || part > 255)) return false

  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 169 && octets[1] === 254)
  )
}

function isPrivateIpv6(value: string): boolean {
  return (
    value === '::1' ||
    value.startsWith('fc') ||
    value.startsWith('fd') ||
    value.startsWith('fe80:') ||
    value.startsWith('::ffff:127.') ||
    value.startsWith('::ffff:10.') ||
    value.startsWith('::ffff:192.168.') ||
    /^::ffff:172\.(1[6-9]|2\d|3[0-1])\./.test(value)
  )
}

function isAllowedHost(value: string): boolean {
  if (!value) return false

  return (
    value === 'localhost' ||
    value === 'localhost.localdomain' ||
    value.endsWith('.local') ||
    isPrivateIpv4(value) ||
    isPrivateIpv6(value)
  )
}

export function isSetupModeEnabled(): boolean {
  return process.env.SETUP_MODE === 'true'
}

export function isRemoteSetupExplicitlyAllowed(): boolean {
  return process.env.SETUP_ALLOW_REMOTE === 'true'
}

export function isSetupProxyTrusted(): boolean {
  return process.env.SETUP_TRUST_PROXY === 'true'
}

export function getSetupRequestDetails(request: HeaderSource) {
  const trustProxy = isSetupProxyTrusted()
  const forwardedHost = trustProxy ? normalizeAddress(request.headers.get('x-forwarded-host')) : ''
  const urlHost = normalizeAddress(new URL(request.url).hostname)
  const hostHeader = normalizeAddress(request.headers.get('host'))
  const host = forwardedHost || hostHeader || urlHost

  const forwardedFor = trustProxy ? firstForwardedValue(request.headers.get('x-forwarded-for')) : ''
  const realIp = trustProxy ? normalizeAddress(request.headers.get('x-real-ip')) : ''
  const clientIp = forwardedFor || realIp

  return {
    host,
    clientIp,
    trustProxy,
    hostAllowed: isAllowedHost(host),
    clientIpAllowed: clientIp ? isAllowedHost(clientIp) : true,
  }
}

export function isSetupRequestAllowed(request: HeaderSource): boolean {
  if (!isSetupModeEnabled()) {
    return false
  }

  if (isRemoteSetupExplicitlyAllowed()) {
    return true
  }

  const { hostAllowed, clientIpAllowed } = getSetupRequestDetails(request)
  return hostAllowed && clientIpAllowed
}
