import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserNotificationPreferences, updateNotificationPreferences } from '@/services/notificationService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Bell, Mail, Clock, Smartphone } from 'lucide-react';

interface NotificationPreferencesData {
  event_reminders_enabled: boolean;
  course_recommendations_enabled: boolean;
  reminder_timing_hours: number;
  push_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
}

export const NotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    
    try {
      const prefs = await getUserNotificationPreferences(user.id);
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !preferences) return;

    setSaving(true);
    try {
      await updateNotificationPreferences(user.id, preferences);
      toast({
        title: "Success",
        description: "Notification preferences updated successfully",
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferencesData, value: boolean | number) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Loading your notification settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Failed to load notification preferences</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Customize how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Reminders */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Event Reminders
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="event-reminders" className="text-sm font-normal">
                Enable event reminders
              </Label>
              <Switch
                id="event-reminders"
                checked={preferences.event_reminders_enabled}
                onCheckedChange={(checked) => updatePreference('event_reminders_enabled', checked)}
              />
            </div>
            
            {preferences.event_reminders_enabled && (
              <div className="ml-4 space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Primary reminder timing
                </Label>
                <Select
                  value={preferences.reminder_timing_hours.toString()}
                  onValueChange={(value) => updatePreference('reminder_timing_hours', parseInt(value))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour before</SelectItem>
                    <SelectItem value="2">2 hours before</SelectItem>
                    <SelectItem value="6">6 hours before</SelectItem>
                    <SelectItem value="12">12 hours before</SelectItem>
                    <SelectItem value="24">24 hours before</SelectItem>
                    <SelectItem value="48">48 hours before</SelectItem>
                    <SelectItem value="168">1 week before</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  You'll also receive additional reminders at 2 hours and 15 minutes before the event
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Course Recommendations */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Course Recommendations</h3>
          <div className="flex items-center justify-between">
            <Label htmlFor="course-recommendations" className="text-sm font-normal">
              Receive personalized course recommendations
            </Label>
            <Switch
              id="course-recommendations"
              checked={preferences.course_recommendations_enabled}
              onCheckedChange={(checked) => updatePreference('course_recommendations_enabled', checked)}
            />
          </div>
          <p className="text-xs text-muted-foreground ml-4">
            We'll suggest courses based on your learning history and interests
          </p>
        </div>

        {/* Delivery Methods */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Delivery Methods</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="text-sm font-normal flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email notifications
              </Label>
              <Switch
                id="email-notifications"
                checked={preferences.email_notifications_enabled}
                onCheckedChange={(checked) => updatePreference('email_notifications_enabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications" className="text-sm font-normal flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Push notifications (coming soon)
              </Label>
              <Switch
                id="push-notifications"
                checked={preferences.push_notifications_enabled}
                onCheckedChange={(checked) => updatePreference('push_notifications_enabled', checked)}
                disabled
              />
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              All notifications will appear in-app and in your inbox regardless of these settings
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};