export interface InvoiceItem {
  id: string;
  description: string;
  subDescription: string;
  spkRef: string;
  qty: number;
  unit: string;
  price: number;
}

export const FONT_CHOICES = ['Caladea', 'Lato', 'Montserrat'] as const;
export type FontChoice = (typeof FONT_CHOICES)[number];

export interface InvoiceData {
  fontFamily: FontChoice;
  primaryColor: string;
  // Sender
  senderName: string;
  senderTitle: string;
  senderLocation: string;
  senderPhone: string;
  senderEmail: string;

  // Client
  clientCompany: string;
  clientPIC: string;
  clientRole: string;
  clientAddress: string;
  clientEmail: string;

  // Invoice meta
  invoiceNumber: string;
  invoiceType: string;
  poRef: string;
  invoiceDate: string;
  dueDate: string;

  // Items
  items: InvoiceItem[];

  // Totals
  discount: number;
  taxRate: number;

  // Payment
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}
