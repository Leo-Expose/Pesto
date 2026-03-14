export async function GET(): Promise<Response> {
  const start = Date.now()

  try {
    return Response.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      latency: `${Date.now() - start}ms`,
    })
  } catch {
    return Response.json({ status: 'error' }, { status: 500 })
  }
}
