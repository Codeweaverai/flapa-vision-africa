
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface OTPEmailProps {
  userFullName: string;
  otpCode: string;
  verificationType: 'login' | 'registration' | 'inactive';
  expirationMinutes: number;
}

const getVerificationTypeMessage = (type: string) => {
  switch (type) {
    case 'registration':
      return 'Welcome to SkillPulse! Please verify your account to get started.';
    case 'inactive':
      return 'Welcome back! For security, please verify your identity after being away.';
    default:
      return 'Please verify your identity to access your SkillPulse account.';
  }
};

export const OTPEmail = ({
  userFullName,
  otpCode,
  verificationType,
  expirationMinutes,
}: OTPEmailProps) => (
  <Html>
    <Head />
    <Preview>Your SkillPulse verification code: {otpCode}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Row>
            <Column>
              <Heading style={h1}>SkillPulse</Heading>
              <Text style={tagline}>Events & Professional Skills Marketplace</Text>
            </Column>
          </Row>
        </Section>

        <Section style={content}>
          <Heading style={h2}>Hello {userFullName}!</Heading>
          <Text style={text}>
            {getVerificationTypeMessage(verificationType)}
          </Text>

          <Section style={otpContainer}>
            <Text style={otpLabel}>Your verification code:</Text>
            <Text style={otpCode}>{otpCode}</Text>
          </Section>

          <Text style={text}>
            Enter this code in the SkillPulse app to complete your verification.
          </Text>

          <Text style={warningText}>
            ⏰ This code will expire in {expirationMinutes} minutes.
          </Text>

          <Text style={securityText}>
            🔒 For your security, never share this code with anyone. If you didn't request this verification, please ignore this email or contact our support team.
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            Best regards,<br />
            The SkillPulse Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f9fafb',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  margin: '0 auto',
  maxWidth: '600px',
  overflow: 'hidden',
};

const header = {
  background: 'linear-gradient(135deg, #fb923c 0%, #a855f7 100%)',
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const tagline = {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '16px',
  margin: '0',
};

const content = {
  padding: '40px',
};

const h2 = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 24px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const otpContainer = {
  backgroundColor: '#f9fafb',
  border: '2px dashed #d1d5db',
  borderRadius: '12px',
  margin: '32px 0',
  padding: '24px',
  textAlign: 'center' as const,
};

const otpLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
};

const otpCode = {
  background: 'linear-gradient(135deg, #fb923c 0%, #a855f7 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontSize: '36px',
  fontWeight: 'bold',
  letterSpacing: '8px',
  margin: '0',
  fontFamily: 'monospace',
};

const warningText = {
  color: '#f59e0b',
  fontSize: '14px',
  fontWeight: '500',
  margin: '24px 0 16px',
  textAlign: 'center' as const,
};

const securityText = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  color: '#92400e',
  fontSize: '14px',
  margin: '24px 0',
  padding: '16px',
};

const footer = {
  borderTop: '1px solid #e5e7eb',
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

export default OTPEmail;
