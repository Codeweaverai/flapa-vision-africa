
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface WelcomeEmailProps {
  name: string;
  userId: string;
}

export const WelcomeEmail = ({ name, userId }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to SkillPulse - Start your learning journey today!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Heading style={h1}>Welcome to SkillPulse! 🎓</Heading>
        </Section>
        
        <Text style={text}>Hi {name},</Text>
        
        <Text style={text}>
          Welcome to SkillPulse! We're excited to have you join our community of learners and creators.
        </Text>

        <Text style={text}>
          Here's what you can do to get started:
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href="https://skillpulse.cloud/explore-courses">
            Browse Courses
          </Button>
        </Section>

        <Section style={featuresSection}>
          <Text style={featuresTitle}>What you can do on SkillPulse:</Text>
          <Text style={featureItem}>📚 Access hundreds of courses</Text>
          <Text style={featureItem}>🎟️ Join exciting events and workshops</Text>
          <Text style={featureItem}>🏆 Earn certificates upon completion</Text>
          <Text style={featureItem}>💬 Connect with other learners</Text>
          <Text style={featureItem}>🎯 Create your own courses (Creator Mode)</Text>
        </Section>

        <Text style={text}>
          Ready to become a course creator? You can enable Creator Mode in your account settings to start sharing your knowledge and earning revenue.
        </Text>

        <Section style={buttonContainer}>
          <Button style={secondaryButton} href="https://skillpulse.cloud/account">
            Go to My Account
          </Button>
        </Section>

        <Text style={footerText}>
          Happy learning!<br />
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

const logoSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const h1 = {
  color: '#333',
  fontSize: '32px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
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
  padding: '16px 32px',
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

const featuresSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const featuresTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const featureItem = {
  color: '#555',
  fontSize: '16px',
  margin: '8px 0',
};

const footerText = {
  color: '#666',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '40px 0 0 0',
};
