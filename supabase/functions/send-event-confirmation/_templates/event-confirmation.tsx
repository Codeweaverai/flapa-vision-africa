
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface EventConfirmationEmailProps {
  attendeeName: string;
  eventTitle: string;
  eventId: string;
  eventDate: string;
  eventTime: string;
  location: string;
  ticketCode: string;
  qrCodeData: string;
  organizerName: string;
}

export const EventConfirmationEmail = ({
  attendeeName,
  eventTitle,
  eventDate,
  eventTime,
  location,
  ticketCode,
  organizerName
}: EventConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your ticket for {eventTitle} is confirmed!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎟️ Your Ticket is Confirmed!</Heading>
        
        <Text style={text}>Hi {attendeeName},</Text>
        
        <Text style={text}>
          Great news! Your registration for <strong>{eventTitle}</strong> has been confirmed.
        </Text>

        <Section style={ticketSection}>
          <Text style={ticketTitle}>🎫 Event Details</Text>
          
          <Text style={detailLabel}>Event:</Text>
          <Text style={detailValue}>{eventTitle}</Text>
          
          <Text style={detailLabel}>Date & Time:</Text>
          <Text style={detailValue}>{new Date(eventDate).toLocaleDateString()} at {eventTime}</Text>
          
          <Text style={detailLabel}>Location:</Text>
          <Text style={detailValue}>{location}</Text>
          
          <Text style={detailLabel}>Organizer:</Text>
          <Text style={detailValue}>{organizerName}</Text>
          
          <Hr style={ticketHr} />
          
          <Text style={ticketCodeLabel}>Ticket Code:</Text>
          <Text style={ticketCodeValue}>{ticketCode}</Text>
        </Section>

        <Section style={qrSection}>
          <Text style={qrTitle}>📱 Your QR Code</Text>
          <Text style={qrText}>
            Show this QR code at the event entrance for quick check-in:
          </Text>
          <Section style={qrPlaceholder}>
            <Text style={qrPlaceholderText}>
              QR Code will be generated<br />
              Ticket Code: {ticketCode}
            </Text>
          </Section>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={`https://skillpulse.cloud/ticket/${ticketCode}`}>
            View Full Ticket
          </Button>
        </Section>

        <Hr style={hr} />

        <Section style={instructionsSection}>
          <Text style={instructionsTitle}>📋 Important Reminders:</Text>
          <Text style={instructionItem}>• Arrive 15 minutes before the event starts</Text>
          <Text style={instructionItem}>• Bring this email or save the QR code to your phone</Text>
          <Text style={instructionItem}>• Check event updates on the event page</Text>
          <Text style={instructionItem}>• Contact support if you have any questions</Text>
        </Section>

        <Text style={text}>
          Can't wait to see you there! If you have any questions, feel free to contact us.
        </Text>

        <Text style={footerText}>
          See you at the event!<br />
          The SkillPulse Events Team
        </Text>
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

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '40px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const ticketSection = {
  backgroundColor: '#f8fafc',
  border: '2px dashed #d1d5db',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const ticketTitle = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 20px 0',
};

const detailLabel = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '12px 0 4px 0',
};

const detailValue = {
  color: '#333',
  fontSize: '16px',
  margin: '0 0 8px 0',
};

const ticketHr = {
  border: 'none',
  borderTop: '1px dashed #d1d5db',
  margin: '20px 0',
};

const ticketCodeLabel = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '12px 0 4px 0',
};

const ticketCodeValue = {
  color: '#7c3aed',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  fontFamily: 'monospace',
  backgroundColor: '#ffffff',
  padding: '12px',
  borderRadius: '8px',
  border: '2px solid #7c3aed',
  margin: '0',
};

const qrSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const qrTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const qrText = {
  color: '#666',
  fontSize: '14px',
  margin: '0 0 16px 0',
};

const qrPlaceholder = {
  backgroundColor: '#f3f4f6',
  border: '2px solid #d1d5db',
  borderRadius: '8px',
  padding: '24px',
  margin: '16px auto',
  width: '200px',
  height: '200px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const qrPlaceholderText = {
  color: '#666',
  fontSize: '12px',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#f59e0b',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
};

const hr = {
  border: 'none',
  borderTop: '1px solid #eee',
  margin: '32px 0',
};

const instructionsSection = {
  margin: '24px 0',
};

const instructionsTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const instructionItem = {
  color: '#555',
  fontSize: '14px',
  margin: '4px 0',
};

const footerText = {
  color: '#666',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '40px 0 0 0',
};
