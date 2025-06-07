
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

interface PaymentItem {
  name: string;
  type: 'course' | 'event_ticket';
  quantity: number;
  price: number;
}

interface PaymentConfirmationEmailProps {
  customerName: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  items: PaymentItem[];
  receiptUrl?: string;
}

export const PaymentConfirmationEmail = ({
  customerName,
  orderId,
  amount,
  currency,
  paymentMethod,
  items,
  receiptUrl
}: PaymentConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Payment confirmed for Order #{orderId}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>✅ Payment Confirmed!</Heading>
        
        <Text style={text}>Hi {customerName},</Text>
        
        <Text style={text}>
          Thank you for your purchase! Your payment has been successfully processed.
        </Text>

        <Section style={orderSection}>
          <Text style={orderTitle}>📋 Order Summary</Text>
          
          <Text style={orderLabel}>Order ID:</Text>
          <Text style={orderValue}>#{orderId}</Text>
          
          <Text style={orderLabel}>Payment Method:</Text>
          <Text style={orderValue}>{paymentMethod}</Text>
          
          <Text style={orderLabel}>Total Amount:</Text>
          <Text style={totalAmount}>{currency.toUpperCase()} {amount.toFixed(2)}</Text>
        </Section>

        <Section style={itemsSection}>
          <Text style={itemsTitle}>🛒 Items Purchased</Text>
          {items.map((item, index) => (
            <Section key={index} style={itemRow}>
              <Text style={itemName}>
                {item.type === 'course' ? '📚' : '🎟️'} {item.name}
              </Text>
              <Text style={itemDetails}>
                Quantity: {item.quantity} × {currency.toUpperCase()} {item.price.toFixed(2)}
              </Text>
            </Section>
          ))}
        </Section>

        <Hr style={hr} />

        <Section style={actionsSection}>
          <Text style={actionsTitle}>🚀 What's Next?</Text>
          
          {items.some(item => item.type === 'course') && (
            <Section style={actionItem}>
              <Text style={actionText}>
                📚 <strong>Start Learning:</strong> Access your courses in your account dashboard
              </Text>
              <Button style={button} href="https://skillpulse.cloud/my-courses">
                View My Courses
              </Button>
            </Section>
          )}
          
          {items.some(item => item.type === 'event_ticket') && (
            <Section style={actionItem}>
              <Text style={actionText}>
                🎟️ <strong>Event Tickets:</strong> Check your tickets and event details
              </Text>
              <Button style={secondaryButton} href="https://skillpulse.cloud/my-events">
                View My Events
              </Button>
            </Section>
          )}
        </Section>

        {receiptUrl && (
          <Section style={receiptSection}>
            <Text style={receiptText}>
              Need a receipt? <a href={receiptUrl} style={link}>Download your receipt here</a>
            </Text>
          </Section>
        )}

        <Hr style={hr} />

        <Text style={supportText}>
          Have questions about your order? Contact our support team at{' '}
          <a href="mailto:support@skillpulse.cloud" style={link}>
            support@skillpulse.cloud
          </a>
        </Text>

        <Text style={footerText}>
          Thank you for choosing SkillPulse!<br />
          The SkillPulse Team
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
  color: '#16a34a',
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

const orderSection = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  border: '1px solid #0ea5e9',
  padding: '24px',
  margin: '24px 0',
};

const orderTitle = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
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
  color: '#16a34a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const itemsSection = {
  margin: '24px 0',
};

const itemsTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const itemRow = {
  backgroundColor: '#f9fafb',
  borderRadius: '6px',
  padding: '16px',
  margin: '8px 0',
};

const itemName = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 4px 0',
};

const itemDetails = {
  color: '#666',
  fontSize: '14px',
  margin: '0',
};

const hr = {
  border: 'none',
  borderTop: '1px solid #eee',
  margin: '32px 0',
};

const actionsSection = {
  margin: '24px 0',
};

const actionsTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const actionItem = {
  margin: '16px 0',
  textAlign: 'center' as const,
};

const actionText = {
  color: '#333',
  fontSize: '14px',
  margin: '0 0 12px 0',
};

const button = {
  backgroundColor: '#7c3aed',
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

const secondaryButton = {
  backgroundColor: '#f59e0b',
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

const receiptSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const receiptText = {
  color: '#666',
  fontSize: '14px',
};

const link = {
  color: '#7c3aed',
  textDecoration: 'underline',
};

const supportText = {
  color: '#666',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '24px 0',
};

const footerText = {
  color: '#666',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '40px 0 0 0',
};
