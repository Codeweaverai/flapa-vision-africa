
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

interface CourseEnrollmentEmailProps {
  studentName: string;
  courseTitle: string;
  courseId: string;
  instructorName: string;
  enrollmentDate: string;
}

export const CourseEnrollmentEmail = ({
  studentName,
  courseTitle,
  courseId,
  instructorName,
  enrollmentDate
}: CourseEnrollmentEmailProps) => (
  <Html>
    <Head />
    <Preview>You're enrolled in {courseTitle} - Start learning today!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 You're Enrolled!</Heading>
        
        <Text style={text}>Hi {studentName},</Text>
        
        <Text style={text}>
          Congratulations! You've successfully enrolled in <strong>{courseTitle}</strong>.
        </Text>

        <Section style={courseInfo}>
          <Text style={infoLabel}>Course:</Text>
          <Text style={infoValue}>{courseTitle}</Text>
          
          <Text style={infoLabel}>Instructor:</Text>
          <Text style={infoValue}>{instructorName}</Text>
          
          <Text style={infoLabel}>Enrolled on:</Text>
          <Text style={infoValue}>{new Date(enrollmentDate).toLocaleDateString()}</Text>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={`https://skillpulse.cloud/course/${courseId}`}>
            Start Learning Now
          </Button>
        </Section>

        <Hr style={hr} />

        <Section style={tipsSection}>
          <Text style={tipsTitle}>💡 Learning Tips:</Text>
          <Text style={tipItem}>• Set aside dedicated time for learning</Text>
          <Text style={tipItem}>• Take notes as you go through lessons</Text>
          <Text style={tipItem}>• Engage with other students in discussions</Text>
          <Text style={tipItem}>• Complete all quizzes and assignments</Text>
          <Text style={tipItem}>• Don't hesitate to ask questions!</Text>
        </Section>

        <Text style={text}>
          Need help? Reply to this email or visit our <a href="https://skillpulse.cloud/help" style={link}>Help Center</a>.
        </Text>

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

const courseInfo = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const infoLabel = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '8px 0 4px 0',
};

const infoValue = {
  color: '#333',
  fontSize: '16px',
  margin: '0 0 16px 0',
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
};

const hr = {
  border: 'none',
  borderTop: '1px solid #eee',
  margin: '32px 0',
};

const tipsSection = {
  margin: '24px 0',
};

const tipsTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const tipItem = {
  color: '#555',
  fontSize: '14px',
  margin: '4px 0',
};

const link = {
  color: '#7c3aed',
  textDecoration: 'underline',
};

const footerText = {
  color: '#666',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '40px 0 0 0',
};
