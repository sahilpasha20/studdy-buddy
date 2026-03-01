import { Bell, BellOff, Volume2, VolumeX, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { testNotification, isNotificationSupported, isInIframe } from "@/lib/notifications";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

interface NotificationSettingsProps {
  reminderTime: string;
  reminderEnabled: boolean;
  notificationPermission: "granted" | "denied" | "default";
  soundEnabled: boolean;
  onEnableReminder: (time: string) => void;
  onDisableReminder: () => void;
  onRequestPermission: () => Promise<{ permission: "granted" | "denied" | "default"; error?: string }>;
  onToggleSound: (enabled: boolean) => void;
}

export function NotificationSettings({
  reminderTime,
  reminderEnabled,
  notificationPermission,
  soundEnabled,
  onEnableReminder,
  onDisableReminder,
  onRequestPermission,
  onToggleSound,
}: NotificationSettingsProps) {
  const handleTestNotification = () => {
    const success = testNotification(soundEnabled);
    if (success) {
      toast.success("Test notification sent!");
    } else {
      toast.error("Failed to send test notification");
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    if (time) {
      onEnableReminder(time);
    }
  };

  const getPermissionBadge = () => {
    switch (notificationPermission) {
      case "granted":
        return <Badge className="bg-green-500">Enabled</Badge>;
      case "denied":
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="secondary">Not Set</Badge>;
    }
  };

  const getPermissionMessage = () => {
    if (!isNotificationSupported()) {
      return (
        <Alert>
          <AlertDescription>
            Your browser doesn't support notifications. You'll receive in-app reminders instead.
          </AlertDescription>
        </Alert>
      );
    }

    switch (notificationPermission) {
      case "granted":
        return (
          <Alert className="border-green-500 bg-green-50">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              Browser notifications are enabled. You'll receive pop-up reminders even when this tab is in the background.
            </AlertDescription>
          </Alert>
        );
      case "denied":
        return (
          <Alert variant="destructive">
            <BellOff className="h-4 w-4" />
            <AlertDescription>
              Notifications are blocked. Please enable them in your browser settings to receive pop-up reminders.
            </AlertDescription>
          </Alert>
        );
      default:
        return (
          <Alert>
            <AlertDescription>
              Enable browser notifications to receive pop-up reminders at your scheduled time.
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Daily Study Reminder
            </CardTitle>
            <CardDescription>
              Get notified at the same time every day to stay on track
            </CardDescription>
          </div>
          {getPermissionBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {getPermissionMessage()}

        <div className="space-y-2">
          <Label htmlFor="reminder-time">Reminder Time</Label>
          <div className="flex gap-2">
            <Input
              id="reminder-time"
              type="time"
              value={reminderTime}
              onChange={handleTimeChange}
              className="flex-1"
            />
            {reminderEnabled && (
              <Button
                variant="outline"
                size="icon"
                onClick={onDisableReminder}
                title="Disable reminder"
              >
                <BellOff className="h-4 w-4" />
              </Button>
            )}
          </div>
          {reminderEnabled && reminderTime && (
            <p className="text-sm text-muted-foreground">
              Next reminder: Today at {reminderTime}
            </p>
          )}
        </div>

        {isNotificationSupported() && notificationPermission !== "granted" && (
          <div className="space-y-2">
            {isInIframe() && (
              <Alert className="border-amber-500 bg-amber-50">
                <ExternalLink className="h-4 w-4" />
                <AlertDescription>
                  Browser notifications require opening this app in a new tab. Click the button below to open in a new window, or use in-app reminders instead.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  const result = await onRequestPermission();
                  if (result.error) {
                    toast.error(result.error, { duration: 6000 });
                  } else if (result.permission === "granted") {
                    toast.success("Browser notifications enabled!");
                  }
                }}
                className="flex-1"
                variant="outline"
              >
                <Bell className="h-4 w-4 mr-2" />
                Enable Notifications
              </Button>
              {isInIframe() && (
                <Button
                  onClick={() => window.open(window.location.href, "_blank")}
                  variant="secondary"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="sound-toggle" className="text-base cursor-pointer">
              Alarm Sound
            </Label>
            <p className="text-sm text-muted-foreground">
              Play an alarm sound when it's time to study
            </p>
          </div>
          <div className="flex items-center gap-2">
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={onToggleSound}
            />
          </div>
        </div>

        <Button
          onClick={handleTestNotification}
          variant="secondary"
          className="w-full"
        >
          <TestTube className="h-4 w-4 mr-2" />
          Test Alarm
        </Button>
      </CardContent>
    </Card>
  );
}
