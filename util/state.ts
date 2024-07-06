export class UptimeFlareStateDb<T> {
  private stateExist = false

  constructor(private db: D1Database) {}

  async get(): Promise<T | null> {
    const result = await this.db
      .prepare("SELECT * FROM kv WHERE key = 'state'")
      .first<{ key: 'state'; value: string }>()

    this.stateExist = !!result

    return result ? this.safeJsonParse(result.value) : null
  }

  async set(value: T) {
    if (this.stateExist) {
      await this.db
        .prepare("UPDATE kv SET value = ? WHERE key = 'state'")
        .bind(JSON.stringify(value))
        .run()
    } else {
      await this.db
        .prepare("INSERT INTO kv (key, value) VALUES ('state', ?)")
        .bind(JSON.stringify(value))
        .run()
      this.stateExist = true
    }
  }

  private safeJsonParse(str: string) {
    try {
      return JSON.parse(str)
    } catch {
      return null
    }
  }
}
