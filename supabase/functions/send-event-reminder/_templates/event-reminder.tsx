
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Text,
  Section,
  Hr,
  Preview,
  Button,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface EventReminderEmailProps {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  organizerName: string;
  eventUrl: string;
  reminderType: 'day_before' | 'hour_before' | '30_minutes_before';
}

export const EventReminderEmail = ({
  attendeeName,
  eventTitle,
  eventDate,
  eventTime,
  location,
  organizerName,
  eventUrl,
  reminderType,
}: EventReminderEmailProps) => {
  const getReminderTitle = () => {
    switch (reminderType) {
      case 'day_before':
        return '📅 Tomorrow: Your Event is Coming Up!';
      case 'hour_before':
        return '⏰ Starting Soon: Your Event Begins in 1 Hour!';
      case '30_minutes_before':
        return '🚀 Final Reminder: Your Event Starts in 30 Minutes!';
      default:
        return '📅 Event Reminder';
    }
  };

  const getReminderMessage = () => {
    switch (reminderType) {
      case 'day_before':
        return 'Your event is tomorrow! Make sure you have everything ready.';
      case 'hour_before':
        return 'Your event starts in just 1 hour. Please join us soon!';
      case '30_minutes_before':
        return 'Your event is starting in 30 minutes. Don\'t miss out!';
      default:
        return 'Your event is coming up soon!';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{getReminderTitle()}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>{getReminderTitle()}</Heading>
          </Section>
          
          <Section style={section}>
            <Text style={text}>Hello {attendeeName},</Text>
            <Text style={text}>{getReminderMessage()}</Text>
            
            <Section style={eventDetails}>
              <Text style={eventTitle}>{eventTitle}</Text>
              <Text style={detail}>📅 Date: {new Date(eventDate).toLocaleDateString()}</Text>
              <Text style={detail}>🕐 Time: {eventTime}</Text>
              <Text style={detail}>📍 Location: {location}</Text>
              <Text style={detail}>👤 Organizer: {organizerName}</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button href={eventUrl} style={button}>
                Join Event Now
              </Button>
            </Section>
            
            <Text style={text}>
              We're excited to see you there! If you have any questions, please don't hesitate to reach out.
            </Text>
            
            <Hr style={hr} />
            
            <Text style={footer}>
              Best regards,<br />
              The SkillPulse Events Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const header = {
  textAlign: 'center' as const,
  marginBottom: '40px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const section = {
  margin: '24px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const eventDetails = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #e9ecef',
  margin: '24px 0',
};

const eventTitle = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const detail = {
  color: '#666',
  fontSize: '14px',
  margin: '8px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const hr = {
  border: 'none',
  borderTop: '1px solid #eee',
  margin: '26px 0',
};

const footer = {
  color: '#898989',
  fontSize: '14px',
  margin: '40px 0 0 0',
};
