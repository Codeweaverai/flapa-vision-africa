
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

interface CourseCompletionEmailProps {
  studentName: string;
  courseTitle: string;
  courseId: string;
  completionDate: string;
  certificateUrl?: string;
  instructorName: string;
}

export const CourseCompletionEmail = ({
  studentName,
  courseTitle,
  courseId,
  completionDate,
  certificateUrl,
  instructorName,
}: CourseCompletionEmailProps) => (
  <Html>
    <Head />
    <Preview>🎉 Congratulations! You've completed {courseTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>🎉 Course Completion!</Heading>
        </Section>
        
        <Section style={section}>
          <Text style={text}>Dear {studentName},</Text>
          <Text style={text}>
            Congratulations! You have successfully completed the course <strong>"{courseTitle}"</strong> on {new Date(completionDate).toLocaleDateString()}.
          </Text>
          
          <Text style={text}>
            Your dedication and hard work have paid off. This achievement represents your commitment to continuous learning and professional growth.
          </Text>

          {certificateUrl && (
            <Section style={buttonContainer}>
              <Button href={certificateUrl} style={button}>
                Download Your Certificate
              </Button>
            </Section>
          )}
          
          <Text style={text}>
            We hope this course has provided you with valuable knowledge and skills that you can apply in your personal and professional endeavors.
          </Text>
          
          <Text style={text}>
            Keep exploring our platform for more exciting courses and continue your learning journey with us!
          </Text>
          
          <Hr style={hr} />
          
          <Text style={footer}>
            Best regards,<br />
            {instructorName}<br />
            SkillPulse Team
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#ff6b35',
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
