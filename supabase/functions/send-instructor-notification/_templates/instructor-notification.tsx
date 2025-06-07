
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

interface InstructorNotificationEmailProps {
  instructorName: string;
  notificationType: 'new_enrollment' | 'course_completed' | 'new_review' | 'payout_ready';
  studentName?: string;
  courseTitle?: string;
  reviewRating?: number;
  reviewText?: string;
  payoutAmount?: number;
  dashboardUrl: string;
}

export const InstructorNotificationEmail = ({
  instructorName,
  notificationType,
  studentName,
  courseTitle,
  reviewRating,
  reviewText,
  payoutAmount,
  dashboardUrl,
}: InstructorNotificationEmailProps) => {
  const getNotificationContent = () => {
    switch (notificationType) {
      case 'new_enrollment':
        return {
          title: '🎉 New Student Enrollment!',
          message: `Great news! ${studentName} has enrolled in your course "${courseTitle}".`,
          buttonText: 'View Student Progress',
        };
      case 'course_completed':
        return {
          title: '✅ Student Course Completion!',
          message: `${studentName} has successfully completed your course "${courseTitle}".`,
          buttonText: 'View Completion Details',
        };
      case 'new_review':
        return {
          title: '⭐ New Course Review!',
          message: `${studentName} left a ${reviewRating}-star review for your course "${courseTitle}".`,
          buttonText: 'View All Reviews',
        };
      case 'payout_ready':
        return {
          title: '💰 Payout Ready!',
          message: `Your payout of $${payoutAmount?.toFixed(2)} is ready for withdrawal.`,
          buttonText: 'Process Payout',
        };
      default:
        return {
          title: '📢 Instructor Notification',
          message: 'You have a new notification.',
          buttonText: 'View Dashboard',
        };
    }
  };

  const content = getNotificationContent();

  return (
    <Html>
      <Head />
      <Preview>{content.title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>{content.title}</Heading>
          </Section>
          
          <Section style={section}>
            <Text style={text}>Hello {instructorName},</Text>
            <Text style={text}>{content.message}</Text>
            
            {notificationType === 'new_review' && reviewText && (
              <Section style={reviewBox}>
                <Text style={reviewTitle}>Review:</Text>
                <Text style={reviewText}>"{reviewText}"</Text>
                <Text style={rating}>Rating: {'⭐'.repeat(reviewRating || 0)}</Text>
              </Section>
            )}
            
            {notificationType === 'payout_ready' && (
              <Section style={payoutBox}>
                <Text style={payoutAmount}>Amount Ready: ${payoutAmount?.toFixed(2)}</Text>
                <Text style={payoutNote}>This payout includes your earnings from recent course sales and event bookings.</Text>
              </Section>
            )}

            <Section style={buttonContainer}>
              <Button href={dashboardUrl} style={button}>
                {content.buttonText}
              </Button>
            </Section>
            
            <Text style={text}>
              Thank you for being an amazing instructor on our platform. Your dedication to education makes a real difference!
            </Text>
            
            <Hr style={hr} />
            
            <Text style={footer}>
              Best regards,<br />
              The SkillPulse Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

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
  fontSize: '24px',
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

const reviewBox = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #e9ecef',
  margin: '24px 0',
};

const reviewTitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const reviewText = {
  color: '#666',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '8px 0',
};

const rating = {
  color: '#ffc107',
  fontSize: '16px',
  margin: '8px 0 0 0',
};

const payoutBox = {
  backgroundColor: '#e8f5e8',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #28a745',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const payoutAmount = {
  color: '#28a745',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const payoutNote = {
  color: '#666',
  fontSize: '14px',
  margin: '8px 0 0 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#28a745',
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
