
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
  Img,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface CoursePaymentEmailProps {
  customerName: string;
  orderId: string;
  courses: Array<{
    id: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
  }>;
  totalAmount: number;
  currency: string;
}

export const CoursePaymentEmail = ({
  customerName,
  orderId,
  courses,
  totalAmount,
  currency
}: CoursePaymentEmailProps) => (
  <Html>
    <Head />
    <Preview>Your SkillPulse courses are ready! Start learning today.</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header with SkillPulse branding */}
        <Section style={headerSection}>
          <Heading style={headerTitle}>✅ Payment Confirmed!</Heading>
          <Text style={brandText}>SkillPulse Learning Platform</Text>
        </Section>
        
        <Text style={greeting}>Hi {customerName},</Text>
        
        <Text style={text}>
          Thank you for your purchase! Your payment has been successfully processed and your courses are now available.
        </Text>

        {/* Order Summary */}
        <Section style={orderSection}>
          <Text style={orderTitle}>📋 Order Summary</Text>
          
          <Text style={orderLabel}>Order ID:</Text>
          <Text style={orderValue}>#{orderId}</Text>
          
          <Text style={orderLabel}>Total Amount:</Text>
          <Text style={totalAmount}>{currency.toUpperCase()} {totalAmount.toFixed(2)}</Text>
        </Section>

        {/* Courses Section */}
        <Section style={coursesSection}>
          <Text style={coursesTitle}>📚 Your Courses</Text>
          {courses.map((course, index) => (
            <Section key={index} style={courseCard}>
              <Text style={courseTitle}>{course.title}</Text>
              {course.description && (
                <Text style={courseDescription}>{course.description}</Text>
              )}
            </Section>
          ))}
        </Section>

        <Hr style={hr} />

        {/* Call to Action */}
        <Section style={ctaSection}>
          <Text style={ctaTitle}>🚀 Ready to Start Learning?</Text>
          <Text style={ctaText}>
            Access all your courses in your learning dashboard and start your journey today!
          </Text>
          
          <Button style={button} href="https://skillpulse.cloud/learning">
            Start Learning Now
          </Button>
          
          <Text style={alternativeText}>
            Or visit: <a href="https://skillpulse.cloud/learning" style={link}>https://skillpulse.cloud/learning</a>
          </Text>
        </Section>

        <Hr style={hr} />

        {/* Support */}
        <Text style={supportText}>
          Have questions? Contact our support team at{' '}
          <a href="mailto:support@skillpulse.cloud" style={link}>
            support@skillpulse.cloud
          </a>
        </Text>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Thank you for choosing SkillPulse!<br />
            Happy Learning! 🎓
          </Text>
          <Text style={footerBranding}>
            The SkillPulse Team
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

const coursesSection = {
  margin: '24px 0',
};

const coursesTitle = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const courseCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '12px 0',
};

const courseTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const courseDescription = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
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
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const ctaText = {
  color: '#666',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 24px 0',
};

const button = {
  background: 'linear-gradient(135deg, #f97316 0%, #a855f7 100%)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  margin: '8px 0 16px 0',
};

const alternativeText = {
  color: '#666',
  fontSize: '14px',
  margin: '16px 0',
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
