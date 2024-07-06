import { MonitorState, MonitorTarget } from '@/uptime.types'
import { Card, Center, Divider } from '@mantine/core'
import MonitorDetail from './MonitorDetail'

export default function MonitorList({
  monitors,
  state,
}: {
  monitors: MonitorTarget[]
  state: MonitorState
}) {
  return (
    <Center>
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        mx="xl"
        mt="xl"
        withBorder
        style={{ width: '865px' }}
      >
        {monitors.map((monitor, i) => (
          <div key={monitor.id} style={{ margin: '0 10px' }}>
            <MonitorDetail monitor={monitor} state={state} />
            {i !== monitors.length - 1 && <Divider mt="xs" />}
          </div>
        ))}
      </Card>
    </Center>
  )
}
