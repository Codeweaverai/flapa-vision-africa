
import { renderToBuffer } from 'npm:@react-pdf/renderer@4.3.0';
import React from 'npm:react@18.3.1';
import { TicketDocument } from './ticket-document.tsx';

interface TicketData {
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

export const generateEventTicketPDF = async (data: TicketData): Promise<Buffer> => {
  const ticketDoc = React.createElement(TicketDocument, data);
  return await renderToBuffer(ticketDoc);
};
