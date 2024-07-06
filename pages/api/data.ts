import { workerConfig } from '@/uptime.config'
import { MonitorState } from '@/uptime.types'
import { UptimeFlareStateDb } from '@/util/state'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export default async function handler(req: NextRequest): Promise<Response> {
  const { UPTIMEFLARE_DB } = process.env as unknown as {
    UPTIMEFLARE_DB: D1Database
  }

  const stateDb = new UptimeFlareStateDb<MonitorState>(UPTIMEFLARE_DB)
  const state = await stateDb.get()
  if (!state) {
    return new Response(JSON.stringify({ error: 'No data available' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  let monitors: any = {}

  for (let monitor of workerConfig.monitors) {
    const isUp = state.incident[monitor.id].slice(-1)[0].end !== undefined
    monitors[monitor.id] = {
      up: isUp,
      latency: state.latency[monitor.id].recent.slice(-1)[0].ping,
      location: state.latency[monitor.id].recent.slice(-1)[0].loc,
      message: isUp ? 'OK' : state.incident[monitor.id].slice(-1)[0].error.slice(-1)[0],
    }
  }

  let ret = {
    up: state.overallUp,
    down: state.overallDown,
    updatedAt: state.lastUpdate,
    monitors: monitors,
  }

  return new Response(JSON.stringify(ret), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
