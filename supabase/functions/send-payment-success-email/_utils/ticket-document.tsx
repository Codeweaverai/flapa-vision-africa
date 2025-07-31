
import React from 'npm:react@18.3.1';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from 'npm:@react-pdf/renderer@4.3.0';

interface TicketDocumentProps {
  ticketCode: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  ticketType: string;
  ticketHolderName: string;
  qrCodeData: string;
  bookingCode: string;
}

export const TicketDocument = ({
  ticketCode,
  eventTitle,
  eventDate,
  eventTime,
  location,
  ticketType,
  ticketHolderName,
  qrCodeData,
  bookingCode
}: TicketDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Main Ticket Container */}
      <View style={styles.ticketContainer}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>SkillPulse</Text>
          <Text style={styles.eventTicketLabel}>EVENT TICKET</Text>
        </View>

        {/* Event Details */}
        <View style={styles.eventSection}>
          <Text style={styles.eventTitle}>{eventTitle}</Text>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>
                {new Date(eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
              <Text style={styles.detailValue}>{eventTime}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{location}</Text>
            </View>
          </View>
        </View>

        {/* Ticket Information */}
        <View style={styles.ticketSection}>
          <View style={styles.ticketInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ticket Type</Text>
              <Text style={styles.infoValue}>{ticketType}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ticket Holder</Text>
              <Text style={styles.infoValue}>{ticketHolderName}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Booking Code</Text>
              <Text style={styles.bookingCode}>{bookingCode}</Text>
            </View>
          </View>

          {/* QR Code Section */}
          <View style={styles.qrSection}>
            <Text style={styles.qrLabel}>Scan for Entry</Text>
            <View style={styles.qrCodePlaceholder}>
              <Text style={styles.qrText}>QR Code</Text>
              <Text style={styles.ticketCodeText}>{ticketCode}</Text>
            </View>
          </View>
        </View>

        {/* Important Notice */}
        <View style={styles.noticeSection}>
          <Text style={styles.noticeTitle}>Important Information</Text>
          <Text style={styles.noticeText}>
            • Please arrive 30 minutes early for check-in{'\n'}
            • Present this ticket (digital or printed) at the entrance{'\n'}
            • This ticket is non-transferable and non-refundable{'\n'}
            • Contact events@skillpulse.cloud for support
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by SkillPulse Events | Thank you for joining us!
          </Text>
        </View>

        {/* Perforated line effect */}
        <View style={styles.perforation}>
          <Text style={styles.perforationText}>- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</Text>
        </View>
      </View>
    </Page>
  </Document>
);

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  ticketContainer: {
    border: '3px solid #a855f7',
    borderRadius: 15,
    padding: 25,
    backgroundColor: '#ffffff',
    minHeight: 600,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#f97316',
    borderBottomStyle: 'solid',
  },
  brandName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#a855f7',
    marginBottom: 5,
  },
  eventTicketLabel: {
    fontSize: 14,
    color: '#f97316',
    letterSpacing: 3,
    fontWeight: 'bold',
  },
  eventSection: {
    marginBottom: 25,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 1.3,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
    marginHorizontal: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: 'bold',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 2,
  },
  ticketSection: {
    flexDirection: 'row',
    marginBottom: 25,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
  },
  ticketInfo: {
    flex: 2,
    paddingRight: 20,
  },
  infoItem: {
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: 'bold',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: 'bold',
  },
  bookingCode: {
    fontSize: 18,
    color: '#f97316',
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  qrSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
    paddingLeft: 20,
  },
  qrLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  qrCodePlaceholder: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: '#a855f7',
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  qrText: {
    fontSize: 14,
    color: '#a855f7',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ticketCodeText: {
    fontSize: 10,
    color: '#666666',
    fontFamily: 'Helvetica',
    textAlign: 'center',
  },
  noticeSection: {
    backgroundColor: '#fef3c7',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderStyle: 'solid',
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 11,
    color: '#92400e',
    lineHeight: 1.4,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderTopStyle: 'solid',
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  perforation: {
    marginTop: 20,
    alignItems: 'center',
  },
  perforationText: {
    fontSize: 12,
    color: '#cccccc',
    letterSpacing: 2,
  },
});
