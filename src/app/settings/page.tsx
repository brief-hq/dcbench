import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { NotificationPreferences } from "@/components/settings/notification-preferences";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">
          Manage your account and notification preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Update your personal information and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialName="Sarah Chen"
            initialEmail="admin@acme.com"
            initialTimezone="America/Los_Angeles"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure how and when you receive digest notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferences
            initialFrequency="weekly"
            initialAlertTypes={["digest", "alert"]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
