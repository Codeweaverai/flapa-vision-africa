
import { renderToBuffer } from 'npm:@react-pdf/renderer@4.3.0';
import React from 'npm:react@18.3.1';
import { ReceiptDocument } from './receipt-document.tsx';

interface ReceiptData {
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

export const generateReceiptPDF = async (data: ReceiptData): Promise<Buffer> => {
  const receiptDoc = React.createElement(ReceiptDocument, data);
  return await renderToBuffer(receiptDoc);
};
