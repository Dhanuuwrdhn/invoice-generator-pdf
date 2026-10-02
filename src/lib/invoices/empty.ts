import type { InvoiceData, InvoiceItem } from '@/types/invoice';

export function newItem(): InvoiceItem {
  return { id: crypto.randomUUID(), description: '', subDescription: '', spkRef: '', qty: 1, unit: 'Package', price: 0 };
}

export function emptyInvoiceData(): InvoiceData {
  return {
    fontFamily: 'Caladea',
    primaryColor: '#1A3A5C',
    senderName: '', senderTitle: '', senderLocation: '', senderPhone: '', senderEmail: '',
    clientCompany: '', clientPIC: '', clientRole: '', clientAddress: '', clientEmail: '',
    invoiceNumber: '', invoiceType: 'DOWN PAYMENT', poRef: '',
    invoiceDate: '', dueDate: '',
    items: [newItem()],
    discount: 0, taxRate: 0,
    bankName: '', accountNumber: '', accountHolder: '',
  };
}
