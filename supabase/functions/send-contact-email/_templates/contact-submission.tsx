
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
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ContactSubmissionEmailProps {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  submissionId: string;
}

export const ContactSubmissionEmail = ({
  firstName,
  lastName,
  email,
  subject,
  message,
  submissionId,
}: ContactSubmissionEmailProps) => (
  <Html>
    <Head />
    <Preview>New contact form submission from {firstName} {lastName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Contact Form Submission</Heading>
        
        <Section style={section}>
          <Text style={label}>From:</Text>
          <Text style={value}>{firstName} {lastName}</Text>
        </Section>

        <Section style={section}>
          <Text style={label}>Email:</Text>
          <Text style={value}>{email}</Text>
        </Section>

        <Section style={section}>
          <Text style={label}>Subject:</Text>
          <Text style={value}>{subject}</Text>
        </Section>

        <Hr style={hr} />

        <Section style={section}>
          <Text style={label}>Message:</Text>
          <Text style={messageText}>{message}</Text>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Submission ID: {submissionId}<br />
          Received at: {new Date().toLocaleString()}
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
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const section = {
  margin: '16px 0',
};

const label = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 4px 0',
};

const value = {
  color: '#333',
  fontSize: '16px',
  margin: '0 0 16px 0',
};

const messageText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  padding: '16px',
  backgroundColor: '#f9f9f9',
  borderRadius: '4px',
  border: '1px solid #eee',
};

const hr = {
  border: 'none',
  borderTop: '1px solid #eee',
  margin: '26px 0',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  margin: '40px 0 0 0',
};
