
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

interface EventPaymentEmailProps {
  customerName: string;
  orderId: string;
  tickets: Array<{
    eventTitle: string;
    eventDate: string;
    location: string;
    ticketType: string;
    ticketCode: string;
    holderName: string;
  }>;
  totalAmount: number;
  currency: string;
}

export const EventPaymentEmail = ({
  customerName,
  orderId,
  tickets,
  totalAmount,
  currency
}: EventPaymentEmailProps) => (
  <Html>
    <Head />
    <Preview>Your SkillPulse event tickets are ready!</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header with SkillPulse branding */}
        <Section style={headerSection}>
          <Heading style={headerTitle}>🎟️ Your Tickets Are Ready!</Heading>
          <Text style={brandText}>SkillPulse Events</Text>
        </Section>
        
        <Text style={greeting}>Hi {customerName},</Text>
        
        <Text style={text}>
          Congratulations! Your payment has been confirmed and your event tickets are attached to this email. 
          We're excited to see you at the event!
        </Text>

        {/* Order Summary */}
        <Section style={orderSection}>
          <Text style={orderTitle}>📋 Order Summary</Text>
          
          <Text style={orderLabel}>Order ID:</Text>
          <Text style={orderValue}>#{orderId}</Text>
          
          <Text style={orderLabel}>Total Amount:</Text>
          <Text style={totalAmount}>{currency.toUpperCase()} {totalAmount.toFixed(2)}</Text>
        </Section>

        {/* Tickets Section */}
        <Section style={ticketsSection}>
          <Text style={ticketsTitle}>🎫 Your Event Tickets</Text>
          {tickets.map((ticket, index) => (
            <Section key={index} style={ticketCard}>
              <Text style={eventTitle}>{ticket.eventTitle}</Text>
              <Text style={ticketDetails}>
                <strong>Date:</strong> {new Date(ticket.eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}<br />
                <strong>Time:</strong> {new Date(ticket.eventDate).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short'
                })}<br />
                <strong>Location:</strong> {ticket.location}<br />
                <strong>Ticket Type:</strong> {ticket.ticketType}<br />
                <strong>Ticket Code:</strong> <code style={ticketCode}>{ticket.ticketCode}</code><br />
                <strong>Holder:</strong> {ticket.holderName}
              </Text>
            </Section>
          ))}
        </Section>

        {/* Important Information */}
        <Section style={infoSection}>
          <Text style={infoTitle}>📌 Important Information</Text>
          <Text style={infoText}>
            • Please bring your ticket PDF (attached) or show it on your mobile device<br />
            • Arrive 30 minutes early for check-in<br />
            • Your ticket includes a QR code for easy entry<br />
            • Keep your ticket safe - it cannot be replaced if lost
          </Text>
        </Section>

        <Hr style={hr} />

        {/* Call to Action */}
        <Section style={ctaSection}>
          <Text style={ctaTitle}>📅 Add to Your Calendar</Text>
          <Text style={ctaText}>
            Don't forget to add this event to your calendar so you don't miss it!
          </Text>
          
          <Button style={button} href="https://skillpulse.cloud/my-events">
            View My Events
          </Button>
        </Section>

        <Hr style={hr} />

        {/* Support */}
        <Text style={supportText}>
          Questions about your event or tickets? Contact us at{' '}
          <a href="mailto:events@skillpulse.cloud" style={link}>
            events@skillpulse.cloud
          </a>
        </Text>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Thank you for choosing SkillPulse Events!<br />
            See you at the event! 🎉
          </Text>
          <Text style={footerBranding}>
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

const headerSection = {
  background: 'linear-gradient(135deg, #f97316 0%, #a855f7 100%)',
  borderRadius: '12px',
  padding: '32px 24px',
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const brandText = {
  color: '#ffffff',
  fontSize: '18px',
  margin: '0',
  opacity: '0.9',
};

const greeting = {
  color: '#333',
  fontSize: '18px',
  fontWeight: '600',
  margin: '24px 0 16px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const orderSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  padding: '24px',
  margin: '24px 0',
};

const orderTitle = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
};

const orderLabel = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '12px 0 4px 0',
};

const orderValue = {
  color: '#333',
  fontSize: '16px',
  margin: '0 0 8px 0',
};

const totalAmount = {
  color: '#f97316',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const ticketsSection = {
  margin: '24px 0',
};

const ticketsTitle = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const ticketCard = {
  backgroundColor: '#ffffff',
  border: '2px solid #a855f7',
  borderRadius: '12px',
  padding: '24px',
  margin: '16px 0',
  position: 'relative' as const,
};

const eventTitle = {
  color: '#a855f7',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const ticketDetails = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const ticketCode = {
  backgroundColor: '#f1f5f9',
  padding: '4px 8px',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontSize: '12px',
  color: '#a855f7',
  fontWeight: 'bold',
};

const infoSection = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const infoTitle = {
  color: '#92400e',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const infoText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const hr = {
  border: 'none',
  borderTop: '1px solid #eee',
  margin: '32px 0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const ctaTitle = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const ctaText = {
  color: '#666',
  fontSize: '16px',
  margin: '0 0 24px 0',
};

const button = {
  background: 'linear-gradient(135deg, #f97316 0%, #a855f7 100%)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '8px',
};

const link = {
  color: '#a855f7',
  textDecoration: 'underline',
};

const supportText = {
  color: '#666',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '24px 0',
};

const footer = {
  textAlign: 'center' as const,
  margin: '40px 0 0 0',
  paddingTop: '24px',
  borderTop: '1px solid #eee',
};

const footerText = {
  color: '#666',
  fontSize: '16px',
  margin: '0 0 8px 0',
};

const footerBranding = {
  color: '#a855f7',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
};
