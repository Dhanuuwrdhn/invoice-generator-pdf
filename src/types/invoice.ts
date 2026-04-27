export interface InvoiceItem {
  id: string;
  description: string;
  subDescription: string;
  spkRef: string;
  qty: number;
  unit: string;
  price: number;
}

export type FontChoice = 'Caladea' | 'Lato' | 'Montserrat';

export interface InvoiceData {
  fontFamily: FontChoice;
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
