
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

interface PayoutSummaryEmailProps {
  creatorName: string;
  payoutAmount: number;
  currency: string;
  payoutMethod: string;
  periodStart: string;
  periodEnd: string;
  transactions: Array<{
    type: 'course' | 'event';
    title: string;
    amount: number;
    date: string;
  }>;
  dashboardUrl: string;
}

export const PayoutSummaryEmail = ({
  creatorName,
  payoutAmount,
  currency,
  payoutMethod,
  periodStart,
  periodEnd,
  transactions,
  dashboardUrl,
}: PayoutSummaryEmailProps) => (
  <Html>
    <Head />
    <Preview>💰 Your payout summary for {new Date(periodStart).toLocaleDateString()} - {new Date(periodEnd).toLocaleDateString()}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>💰 Payout Summary</Heading>
        </Section>
        
        <Section style={section}>
          <Text style={text}>Hello {creatorName},</Text>
          <Text style={text}>
            Here's your payout summary for the period from {new Date(periodStart).toLocaleDateString()} to {new Date(periodEnd).toLocaleDateString()}.
          </Text>
          
          <Section style={payoutSummary}>
            <Text style={summaryTitle}>Payout Details</Text>
            <Text style={payoutAmount}>{currency} {payoutAmount.toFixed(2)}</Text>
            <Text style={payoutMethod}>Method: {payoutMethod}</Text>
          </Section>
          
          <Section style={transactionsSection}>
            <Text style={transactionsTitle}>Transactions Breakdown:</Text>
            {transactions.map((transaction, index) => (
              <div key={index} style={transactionItem}>
                <Text style={transactionTitle}>{transaction.title}</Text>
                <Text style={transactionDetails}>
                  {transaction.type === 'course' ? '📚 Course' : '🎫 Event'} • {new Date(transaction.date).toLocaleDateString()} • {currency} {transaction.amount.toFixed(2)}
                </Text>
              </div>
            ))}
          </Section>

          <Section style={buttonContainer}>
            <Button href={dashboardUrl} style={button}>
              View Full Dashboard
            </Button>
          </Section>
          
          <Text style={text}>
            Thank you for being a valued creator on our platform. Your contributions help learners around the world achieve their goals!
          </Text>
          
          <Hr style={hr} />
          
          <Text style={footer}>
            Best regards,<br />
            The SkillPulse Creator Team<br />
            <br />
            Questions about your payout? Contact us at support@skillpulse.cloud
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

const header = {
  textAlign: 'center' as const,
  marginBottom: '40px',
};

const h1 = {
  color: '#333',
  fontSize: '28px',
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

const payoutSummary = {
  backgroundColor: '#e8f5e8',
  padding: '24px',
  borderRadius: '8px',
  border: '2px solid #28a745',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const summaryTitle = {
  color: '#28a745',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const payoutAmount = {
  color: '#28a745',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const payoutMethod = {
  color: '#666',
  fontSize: '14px',
  margin: '8px 0 0 0',
};

const transactionsSection = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #e9ecef',
  margin: '24px 0',
};

const transactionsTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const transactionItem = {
  borderBottom: '1px solid #e9ecef',
  paddingBottom: '12px',
  marginBottom: '12px',
};

const transactionTitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 4px 0',
};

const transactionDetails = {
  color: '#666',
  fontSize: '14px',
  margin: '0',
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
