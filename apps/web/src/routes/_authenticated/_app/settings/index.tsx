import { Separator } from '~/lib/components/ui/separator'
import { ProfileForm } from './-components/profile-form'
import { createFileRoute } from '@tanstack/react-router'

const SettingsProfilePage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          This is how others will see you on the site.
        </p>
      </div>
      <Separator />
      <ProfileForm />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/_app/settings/')({
  component: SettingsProfilePage,
})
