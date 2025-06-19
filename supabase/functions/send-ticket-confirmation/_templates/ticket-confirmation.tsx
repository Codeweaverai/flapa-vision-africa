
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Row,
  Column,
  Button,
  Hr,
  Img
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface TicketConfirmationEmailProps {
  userName: string;
  orderData: {
    id: string;
    total_amount: number;
    currency: string;
    created_at: string;
    event_bookings: Array<{
      id: string;
      booking_code: string;
      ticket_quantity: number;
      event: {
        title: string;
        start_time: string;
        location: string;
        image_url?: string;
      };
      event_ticket: {
        name: string;
        ticket_type: string;
      };
    }>;
  };
  ticketUrls: string[];
  siteUrl: string;
}

export const TicketConfirmationEmail = ({
  userName,
  orderData,
  ticketUrls,
  siteUrl
}: TicketConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your event tickets are ready! 🎟️</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your Event Tickets Are Ready! 🎟️</Heading>
        
        <Text style={text}>
          Hi {userName},
        </Text>
        
        <Text style={text}>
          Great news! Your payment has been confirmed and your event tickets are now ready. 
          Here are the details of your booking:
        </Text>

        <Section style={orderSection}>
          <Heading style={h2}>Order Summary</Heading>
          <Text style={orderInfo}>
            <strong>Order ID:</strong> #{orderData.id.slice(0, 8)}<br/>
            <strong>Total Amount:</strong> {orderData.currency} {orderData.total_amount.toFixed(2)}<br/>
            <strong>Order Date:</strong> {new Date(orderData.created_at).toLocaleDateString()}
          </Text>
        </Section>

        {orderData.event_bookings.map((booking, index) => (
          <Section key={booking.id} style={ticketSection}>
            <Row>
              <Column>
                <Heading style={h3}>{booking.event.title}</Heading>
                <Text style={eventDetails}>
                  <strong>Date:</strong> {new Date(booking.event.start_time).toLocaleDateString()}<br/>
                  <strong>Time:</strong> {new Date(booking.event.start_time).toLocaleTimeString()}<br/>
                  <strong>Location:</strong> {booking.event.location}<br/>
                  <strong>Ticket Type:</strong> {booking.event_ticket.name}<br/>
                  <strong>Quantity:</strong> {booking.ticket_quantity}<br/>
                  <strong>Booking Code:</strong> {booking.booking_code}
                </Text>
                
                <Button 
                  href={ticketUrls[index]} 
                  style={button}
                >
                  View & Download Tickets
                </Button>
              </Column>
            </Row>
          </Section>
        ))}

        <Hr style={hr} />

        <Section style={importantSection}>
          <Heading style={h3}>Important Information</Heading>
          <Text style={text}>
            • Please arrive at the venue 30 minutes before the event starts<br/>
            • Bring a valid form of ID along with your ticket<br/>
            • Present the QR code on your ticket for entry<br/>
            • Keep your tickets safe - they cannot be replaced if lost<br/>
            • No refunds or exchanges are allowed unless the event is cancelled
          </Text>
        </Section>

        <Section style={supportSection}>
          <Text style={text}>
            If you have any questions about your booking or need assistance, 
            please don't hesitate to contact our support team.
          </Text>
          
          <Button 
            href={`${siteUrl}/contact`} 
            style={supportButton}
          >
            Contact Support
          </Button>
        </Section>

        <Text style={footer}>
          Thank you for choosing SkillPulse Events!<br/>
          We hope you have a wonderful time at the event.
        </Text>

        <Text style={disclaimer}>
          This email was sent to confirm your event ticket purchase. 
          If you didn't make this purchase, please contact our support team immediately.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default TicketConfirmationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#333',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '30px 0 15px',
};

const h3 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '20px 0 10px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const orderSection = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
};

const orderInfo = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const ticketSection = {
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const eventDetails = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '10px 0',
};

const button = {
  backgroundColor: '#f97316',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  margin: '16px 0',
};

const supportButton = {
  backgroundColor: '#6366f1',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
  margin: '16px 0',
};

const hr = {
  borderColor: '#e9ecef',
  margin: '30px 0',
};

const importantSection = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeaa7',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const supportSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '32px 0',
  textAlign: 'center' as const,
};

const disclaimer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 0',
  textAlign: 'center' as const,
};
