import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import { Layout } from '@/components/layout/Layout';

const NotificationSettingsPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
          <p className="text-muted-foreground">
            Manage your notification preferences and stay updated on what matters to you.
          </p>
        </div>
        
        <NotificationPreferences />
      </div>
    </Layout>
  );
};

export default NotificationSettingsPage;