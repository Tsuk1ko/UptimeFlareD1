interface StateRow {
  idx: number
  val: string
}

// D1 max row size 1MB, so we split the state into chunks of 900KB and store them in separate rows.
const SPLIT_SIZE = 9e5

export class UptimeFlareStateDb<T> {
  private stateSize = 0

  constructor(private db: D1Database) {}

  async get(): Promise<T | null> {
    const { results } = await this.db
      .prepare('SELECT * FROM state ORDER BY idx ASC')
      .all<StateRow>()

    this.stateSize = results.length

    return this.stateSize ? this.safeJsonParse(results.map(({ val }) => val).join('')) : null
  }

  async set(value: T) {
    const chunks = []
    for (let str = JSON.stringify(value); str.length; str = str.slice(SPLIT_SIZE)) {
      chunks.push(str.slice(0, SPLIT_SIZE))
    }
    for (const [i, chunk] of chunks.entries()) {
      if (i < this.stateSize) {
        await this.db.prepare('UPDATE state SET val = ? WHERE idx = ?').bind(chunk, i).run()
      } else {
        await this.db.prepare('INSERT INTO state (idx, val) VALUES (?, ?)').bind(i, chunk).run()
      }
    }
    this.stateSize = chunks.length
  }

  private safeJsonParse(str: string) {
    try {
      const val = JSON.parse(str)
      return val && typeof val === 'object' ? val : null
    } catch {
      return null
    }
  }
}
