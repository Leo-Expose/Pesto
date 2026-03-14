import { db, isDbConfigured } from '@/lib/db'
import { appSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isValidTheme } from '@/lib/themes'

export const DEFAULT_APP_SETTINGS = {
  allowRegistrations: true,
  enableGithub: false,
  enableGoogle: false,
  setupCompleted: false,
  instanceName: 'Pesto',
  defaultTheme: 'github-dark',
  maxPasteSize: 1_048_576,
}

export async function getAppSettings() {
  if (!isDbConfigured()) {
    return DEFAULT_APP_SETTINGS
  }

  try {
    const settings = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.id, 'global'))
      .limit(1)

    if (settings.length === 0) {
      return DEFAULT_APP_SETTINGS
    }

    const defaultTheme = isValidTheme(settings[0].defaultTheme ?? '')
      ? (settings[0].defaultTheme as string)
      : DEFAULT_APP_SETTINGS.defaultTheme

    return {
      allowRegistrations: settings[0].allowRegistrations ?? DEFAULT_APP_SETTINGS.allowRegistrations,
      enableGithub: settings[0].enableGithub ?? DEFAULT_APP_SETTINGS.enableGithub,
      enableGoogle: settings[0].enableGoogle ?? DEFAULT_APP_SETTINGS.enableGoogle,
      setupCompleted: settings[0].setupCompleted ?? DEFAULT_APP_SETTINGS.setupCompleted,
      instanceName: settings[0].instanceName ?? DEFAULT_APP_SETTINGS.instanceName,
      defaultTheme,
      maxPasteSize: settings[0].maxPasteSize ?? DEFAULT_APP_SETTINGS.maxPasteSize,
    }
  } catch {
    return DEFAULT_APP_SETTINGS
  }
}
