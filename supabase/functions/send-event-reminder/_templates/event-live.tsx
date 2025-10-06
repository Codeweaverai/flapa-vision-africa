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

interface EventLiveEmailProps {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  organizerName: string;
  eventUrl: string;
  onlineMeetingLink?: string;
}

export const EventLiveEmail = ({
  attendeeName,
  eventTitle,
  eventDate,
  eventTime,
  location,
  organizerName,
  eventUrl,
  onlineMeetingLink,
}: EventLiveEmailProps) => (
  <Html>
    <Head />
    <Preview>🔴 LIVE NOW: {eventTitle} has started!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={liveHeader}>
          <Heading style={h1}>🔴 LIVE NOW</Heading>
          <Text style={liveSubtitle}>Your event has started!</Text>
        </Section>
        
        <Section style={section}>
          <Text style={text}>Hi {attendeeName},</Text>
          
          <Text style={urgentText}>
            <strong>{eventTitle}</strong> is now live! Join us now to not miss out on the action.
          </Text>
          
          <Section style={eventDetails}>
            <Text style={eventTitle}>{eventTitle}</Text>
            <Text style={detail}>📅 Date: {new Date(eventDate).toLocaleDateString()}</Text>
            <Text style={detail}>🕐 Time: {eventTime}</Text>
            <Text style={detail}>📍 Location: {location}</Text>
            <Text style={detail}>👤 Organizer: {organizerName}</Text>
          </Section>

          <Section style={buttonContainer}>
            {onlineMeetingLink ? (
              <Button href={onlineMeetingLink} style={primaryButton}>
                🎥 Join Online Event Now
              </Button>
            ) : (
              <Button href={eventUrl} style={primaryButton}>
                📍 Get Directions
              </Button>
            )}
          </Section>

          <Section style={infoBox}>
            <Text style={infoTitle}>⚡ Quick Tips:</Text>
            <Text style={infoItem}>• Have your ticket/QR code ready</Text>
            <Text style={infoItem}>• Check in at the registration desk</Text>
            <Text style={infoItem}>• Network with other attendees</Text>
            <Text style={infoItem}>• Share your experience on social media!</Text>
          </Section>
          
          <Hr style={hr} />
          
          <Text style={footer}>
            Enjoy the event!<br />
            The SkillPulse Events Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const liveHeader = {
  textAlign: 'center' as const,
  backgroundColor: '#dc2626',
  padding: '24px',
  borderRadius: '12px 12px 0 0',
  marginBottom: '0',
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
};

const liveSubtitle = {
  color: '#ffffff',
  fontSize: '18px',
  margin: '8px 0 0 0',
  fontWeight: '600',
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

const urgentText = {
  color: '#dc2626',
  fontSize: '18px',
  lineHeight: '28px',
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#fee2e2',
  borderRadius: '8px',
  borderLeft: '4px solid #dc2626',
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

const primaryButton = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  boxShadow: '0 4px 6px rgba(220, 38, 38, 0.3)',
};

const infoBox = {
  backgroundColor: '#f0f9ff',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #bfdbfe',
  margin: '24px 0',
};

const infoTitle = {
  color: '#1e40af',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const infoItem = {
  color: '#1e3a8a',
  fontSize: '14px',
  margin: '6px 0',
};

const hr = {
  border: 'none',
  borderTop: '1px solid #eee',
  margin: '32px 0',
};

const footer = {
  color: '#898989',
  fontSize: '14px',
  margin: '40px 0 0 0',
  textAlign: 'center' as const,
};
