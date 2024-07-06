import Head from 'next/head'

import { Inter } from 'next/font/google'
import { MonitorState, MonitorTarget } from '@/uptime.types'
import { pageConfig, workerConfig } from '@/uptime.config'
import OverallStatus from '@/components/OverallStatus'
import Header from '@/components/Header'
import MonitorList from '@/components/MonitorList'
import { Center, Divider, Text } from '@mantine/core'
import MonitorDetail from '@/components/MonitorDetail'
import { UptimeFlareStateDb } from '@/util/state'

export const runtime = 'experimental-edge'
const inter = Inter({ subsets: ['latin'] })

export default function Home({
  state,
  monitors,
}: {
  state: MonitorState | null
  monitors: MonitorTarget[]
  tooltip?: string
  statusPageLink?: string
}) {
  // Specify monitorId in URL hash to view a specific monitor (can be used in iframe)
  const monitorId = window.location.hash.substring(1)
  if (monitorId) {
    const monitor = monitors.find((monitor) => monitor.id === monitorId)
    if (!monitor || !state) {
      return <Text fw={700}>Monitor with id {monitorId} not found!</Text>
    }
    return (
      <div style={{ maxWidth: '810px' }}>
        <MonitorDetail monitor={monitor} state={state} />
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{pageConfig.title}</title>
        <link rel="icon" href="/favicon.ico" />
        <style type="text/css">{'a{text-decoration:none!important}'}</style>
      </Head>

      <main className={inter.className}>
        <Header />

        {!state ? (
          <Center>
            <Text fw={700}>
              Monitor State is not defined now, please check your worker&apos;s status and D1
              binding!
            </Text>
          </Center>
        ) : (
          <div>
            <OverallStatus state={state} />
            <MonitorList monitors={monitors} state={state} />
          </div>
        )}

        <Divider mt="lg" />
        <Text
          size="xs"
          py="xs"
          style={{
            textAlign: 'center',
          }}
        >
          Open-source monitoring and status page powered by{' '}
          <a href="https://github.com/Tsuk1ko/UptimeFlareD1" target="_blank">
            UptimeFlareD1
          </a>{' '}
          and{' '}
          <a href="https://www.cloudflare.com/" target="_blank">
            Cloudflare
          </a>
          , made with ❤ by{' '}
          <a href="https://github.com/lyc8503" target="_blank">
            lyc8503
          </a>
          .
        </Text>
      </main>
    </>
  )
}

export async function getServerSideProps() {
  const { UPTIMEFLARE_DB } = process.env as unknown as {
    UPTIMEFLARE_DB: D1Database
  }

  // Read state as string from KV, to avoid hitting server-side cpu time limit
  const stateDb = new UptimeFlareStateDb<MonitorState>(UPTIMEFLARE_DB)
  const state = await stateDb.get()

  // Only present these values to client
  const monitors = workerConfig.monitors.map((monitor) => {
    return {
      id: monitor.id,
      name: monitor.name,
      // @ts-ignore
      tooltip: monitor?.tooltip,
      // @ts-ignore
      statusPageLink: monitor?.statusPageLink,
    }
  })

  return { props: { state, monitors } }
}
