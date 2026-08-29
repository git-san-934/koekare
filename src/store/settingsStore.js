import { getDB } from './db.js'
import { withDefaults } from '../domain/settings.js'

const KEY = 'app'

export async function getSettings() {
  const db = await getDB()
  const record = await db.get('settings', KEY)
  return withDefaults(record)
}

export async function updateSettings(partial) {
  const db = await getDB()
  const current = await getSettings()
  const next = { ...current, ...partial, key: KEY }
  await db.put('settings', next)
  return withDefaults(next)
}
