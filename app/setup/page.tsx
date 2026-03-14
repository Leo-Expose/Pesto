import { redirect } from 'next/navigation'
import SetupClient from './SetupClient'
import { isSetupModeEnabled } from '@/lib/setupAccess'
import { isSetupLocked } from '@/lib/setupState'

export default async function SetupPage() {
  if (!isSetupModeEnabled()) {
    redirect('/')
  }

  if (await isSetupLocked()) {
    redirect('/login')
  }

  return <SetupClient />
}
