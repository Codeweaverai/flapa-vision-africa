import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface BookingConfirmationEmailProps {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventEndTime: string;
  eventType: 'online' | 'physical' | 'hybrid';
  location?: string;
  onlineMeetingLink?: string;
  bookingCode: string;
  ticketCode?: string;
  ticketName?: string;
  ticketQuantity: number;
  organizerName: string;
  eventImageUrl?: string;
  eventDescription?: string;
}

export const BookingConfirmationEmail = ({
  attendeeName,
  eventTitle,
  eventDate,
  eventTime,
  eventEndTime,
  eventType,
  location,
  onlineMeetingLink,
  bookingCode,
  ticketCode,
  ticketName,
  ticketQuantity,
  organizerName,
  eventImageUrl,
  eventDescription,
}: BookingConfirmationEmailProps) => {
  const isOnlineEvent = eventType === 'online';
  const isHybridEvent = eventType === 'hybrid';
  const isPhysicalEvent = eventType === 'physical';

  return (
    <Html>
      <Head>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          `}
        </style>
      </Head>
      <Preview>🎉 Your booking for {eventTitle} is confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with gradient */}
          <Section style={headerSection}>
            <Heading style={headerTitle}>🎟️ Booking Confirmed!</Heading>
            <Text style={headerSubtitle}>You're all set for an amazing experience</Text>
          </Section>

          {/* Event Image */}
          {eventImageUrl && (
            <Section style={imageSection}>
              <Img
                src={eventImageUrl}
                alt={eventTitle}
                style={eventImage}
              />
            </Section>
          )}

          {/* Greeting */}
          <Section style={greetingSection}>
            <Text style={greetingText}>Hi {attendeeName},</Text>
            <Text style={confirmationText}>
              Great news! Your booking for <strong style={eventTitleInline}>{eventTitle}</strong> has been confirmed. 
              We can't wait to see you there!
            </Text>
          </Section>

          {/* Ticket Card */}
          <Section style={ticketCard}>
            <Section style={ticketHeader}>
              <Text style={ticketHeaderText}>🎫 YOUR TICKET</Text>
            </Section>
            
            <Section style={ticketBody}>
              {/* Event Title */}
              <Text style={ticketEventTitle}>{eventTitle}</Text>
              
              {/* Date & Time */}
              <Section style={detailRow}>
                <Text style={detailIcon}>📅</Text>
                <Section style={detailContent}>
                  <Text style={detailLabel}>Date & Time</Text>
                  <Text style={detailValue}>{eventDate}</Text>
                  <Text style={detailSubvalue}>{eventTime} - {eventEndTime}</Text>
                </Section>
              </Section>

              {/* Location or Online Link */}
              {(isPhysicalEvent || isHybridEvent) && location && (
                <Section style={detailRow}>
                  <Text style={detailIcon}>📍</Text>
                  <Section style={detailContent}>
                    <Text style={detailLabel}>Venue</Text>
                    <Text style={detailValue}>{location}</Text>
                  </Section>
                </Section>
              )}

              {(isOnlineEvent || isHybridEvent) && onlineMeetingLink && (
                <Section style={detailRow}>
                  <Text style={detailIcon}>💻</Text>
                  <Section style={detailContent}>
                    <Text style={detailLabel}>Online Event</Text>
                    <Text style={detailValue}>Join from anywhere!</Text>
                    <Button style={joinButton} href={onlineMeetingLink}>
                      Join Meeting
                    </Button>
                  </Section>
                </Section>
              )}

              {/* Organizer */}
              <Section style={detailRow}>
                <Text style={detailIcon}>👤</Text>
                <Section style={detailContent}>
                  <Text style={detailLabel}>Hosted by</Text>
                  <Text style={detailValue}>{organizerName}</Text>
                </Section>
              </Section>

              {/* Ticket Info */}
              {ticketName && (
                <Section style={detailRow}>
                  <Text style={detailIcon}>🎟️</Text>
                  <Section style={detailContent}>
                    <Text style={detailLabel}>Ticket Type</Text>
                    <Text style={detailValue}>{ticketName} × {ticketQuantity}</Text>
                  </Section>
                </Section>
              )}

              <Hr style={ticketDivider} />

              {/* Booking & Ticket Codes */}
              <Section style={codesSection}>
                <Section style={codeBox}>
                  <Text style={codeLabel}>Booking Code</Text>
                  <Text style={codeValue}>{bookingCode}</Text>
                </Section>
                
                {ticketCode && (
                  <Section style={codeBox}>
                    <Text style={codeLabel}>Ticket Code</Text>
                    <Text style={codeValue}>{ticketCode}</Text>
                  </Section>
                )}
              </Section>

              {/* QR Code Placeholder */}
              <Section style={qrSection}>
                <Section style={qrPlaceholder}>
                  <Text style={qrPlaceholderText}>
                    📱 QR Code<br />
                    Show this at entry
                  </Text>
                </Section>
                <Text style={qrNote}>Present this code at the event for quick check-in</Text>
              </Section>
            </Section>
          </Section>

          {/* Important Information */}
          <Section style={infoSection}>
            <Text style={infoTitle}>📋 Important Information</Text>
            
            {(isPhysicalEvent || isHybridEvent) && (
              <Section style={infoItem}>
                <Text style={infoBullet}>•</Text>
                <Text style={infoText}>Arrive at least 15 minutes before the event starts</Text>
              </Section>
            )}
            
            {(isOnlineEvent || isHybridEvent) && (
              <Section style={infoItem}>
                <Text style={infoBullet}>•</Text>
                <Text style={infoText}>Test your audio and video before joining</Text>
              </Section>
            )}
            
            <Section style={infoItem}>
              <Text style={infoBullet}>•</Text>
              <Text style={infoText}>Keep this email or save a screenshot of your ticket</Text>
            </Section>
            
            <Section style={infoItem}>
              <Text style={infoBullet}>•</Text>
              <Text style={infoText}>Check your email for any event updates</Text>
            </Section>
          </Section>

          {/* CTA Button */}
          <Section style={ctaSection}>
            <Button 
              style={primaryButton} 
              href={`https://skillpulse.cloud/ticket/${bookingCode}`}
            >
              View Full Ticket Details
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={footerDivider} />
          
          <Section style={footerSection}>
            <Text style={footerText}>
              Questions about your booking? Contact us at support@skillpulse.cloud
            </Text>
            <Text style={footerSignature}>
              See you at the event! 🎉<br />
              <strong>The SkillPulse Events Team</strong>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingConfirmationEmail;

// Styles
const main = {
  backgroundColor: '#f4f4f5',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};

const headerSection = {
  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
  borderRadius: '16px 16px 0 0',
  padding: '40px 32px',
  textAlign: 'center' as const,
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 8px 0',
  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const headerSubtitle = {
  color: 'rgba(255,255,255,0.9)',
  fontSize: '16px',
  margin: '0',
};

const imageSection = {
  backgroundColor: '#ffffff',
  padding: '0',
};

const eventImage = {
  width: '100%',
  height: '200px',
  objectFit: 'cover' as const,
};

const greetingSection = {
  backgroundColor: '#ffffff',
  padding: '32px',
};

const greetingText = {
  color: '#18181b',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const confirmationText = {
  color: '#3f3f46',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0',
};

const eventTitleInline = {
  color: '#7c3aed',
};

const ticketCard = {
  backgroundColor: '#ffffff',
  margin: '0',
  borderRadius: '0',
  overflow: 'hidden' as const,
};

const ticketHeader = {
  background: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)',
  padding: '16px 32px',
};

const ticketHeaderText = {
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0',
  textTransform: 'uppercase' as const,
};

const ticketBody = {
  padding: '32px',
};

const ticketEventTitle = {
  color: '#18181b',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 24px 0',
};

const detailRow = {
  marginBottom: '20px',
};

const detailIcon = {
  fontSize: '20px',
  marginBottom: '8px',
};

const detailContent = {
  marginLeft: '0',
};

const detailLabel = {
  color: '#71717a',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px 0',
};

const detailValue = {
  color: '#18181b',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0',
};

const detailSubvalue = {
  color: '#52525b',
  fontSize: '14px',
  margin: '4px 0 0 0',
};

const joinButton = {
  backgroundColor: '#7c3aed',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  marginTop: '12px',
};

const ticketDivider = {
  border: 'none',
  borderTop: '2px dashed #e4e4e7',
  margin: '24px 0',
};

const codesSection = {
  display: 'flex' as const,
  gap: '16px',
  marginBottom: '24px',
};

const codeBox = {
  flex: '1',
  backgroundColor: '#faf5ff',
  border: '2px solid #e9d5ff',
  borderRadius: '12px',
  padding: '16px',
  textAlign: 'center' as const,
  marginBottom: '12px',
};

const codeLabel = {
  color: '#7c3aed',
  fontSize: '11px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px 0',
};

const codeValue = {
  color: '#18181b',
  fontSize: '18px',
  fontWeight: '700',
  fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', monospace",
  margin: '0',
};

const qrSection = {
  textAlign: 'center' as const,
};

const qrPlaceholder = {
  backgroundColor: '#f4f4f5',
  border: '2px dashed #d4d4d8',
  borderRadius: '12px',
  padding: '32px',
  margin: '0 auto 12px',
  maxWidth: '180px',
};

const qrPlaceholderText = {
  color: '#71717a',
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.5',
};

const qrNote = {
  color: '#a1a1aa',
  fontSize: '12px',
  margin: '0',
};

const infoSection = {
  backgroundColor: '#fefce8',
  border: '1px solid #fef08a',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const infoTitle = {
  color: '#854d0e',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const infoItem = {
  marginBottom: '8px',
};

const infoBullet = {
  color: '#ca8a04',
  display: 'inline',
  marginRight: '8px',
};

const infoText = {
  color: '#713f12',
  fontSize: '14px',
  display: 'inline',
  margin: '0',
};

const ctaSection = {
  textAlign: 'center' as const,
  padding: '0 0 32px 0',
};

const primaryButton = {
  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
};

const footerDivider = {
  border: 'none',
  borderTop: '1px solid #e4e4e7',
  margin: '0 0 24px 0',
};

const footerSection = {
  textAlign: 'center' as const,
  padding: '0 32px 32px',
};

const footerText = {
  color: '#71717a',
  fontSize: '14px',
  margin: '0 0 16px 0',
};

const footerSignature = {
  color: '#52525b',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};
