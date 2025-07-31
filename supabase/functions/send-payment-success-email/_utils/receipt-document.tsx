
import React from 'npm:react@18.3.1';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from 'npm:@react-pdf/renderer@4.3.0';

interface ReceiptDocumentProps {
  orderId: string;
  customerName: string;
  userEmail: string;
  items: Array<{
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
}

export const ReceiptDocument = ({
  orderId,
  customerName,
  userEmail,
  items,
  totalAmount,
  currency,
  paymentMethod
}: ReceiptDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with SkillPulse branding */}
      <View style={styles.header}>
        <Text style={styles.companyName}>SkillPulse</Text>
        <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>
      </View>

      {/* Order Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Order ID:</Text>
          <Text style={styles.value}>#{orderId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{new Date().toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment Method:</Text>
          <Text style={styles.value}>{paymentMethod}</Text>
        </View>
      </View>

      {/* Customer Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{customerName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{userEmail}</Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items Purchased</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Item</Text>
          <Text style={styles.tableHeaderText}>Qty</Text>
          <Text style={styles.tableHeaderText}>Price</Text>
          <Text style={styles.tableHeaderText}>Total</Text>
        </View>
        {items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>{item.item_name}</Text>
            <Text style={styles.tableCell}>{item.quantity}</Text>
            <Text style={styles.tableCell}>{currency.toUpperCase()} {item.unit_price.toFixed(2)}</Text>
            <Text style={styles.tableCell}>{currency.toUpperCase()} {item.total_price.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL AMOUNT:</Text>
          <Text style={styles.totalAmount}>{currency.toUpperCase()} {totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Thank you for your business!</Text>
        <Text style={styles.footerText}>SkillPulse Learning Platform</Text>
        <Text style={styles.footerSubtext}>support@skillpulse.cloud</Text>
      </View>
    </Page>
  </Document>
);

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f97316',
    borderBottomStyle: 'solid',
  },
  companyName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#a855f7',
    marginBottom: 8,
  },
  receiptTitle: {
    fontSize: 16,
    color: '#666666',
    letterSpacing: 2,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#666666',
    width: 120,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 12,
    color: '#333333',
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'solid',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
  },
  tableCell: {
    fontSize: 11,
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#f97316',
    borderTopStyle: 'solid',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 20,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f97316',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderTopStyle: 'solid',
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999999',
  },
});
