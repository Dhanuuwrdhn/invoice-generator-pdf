import { z } from 'zod';
import { FONT_CHOICES } from '@/types/invoice';

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const credentialsSchema = z.object({
  email,
  password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(200),
});

const text = (max = 200) => z.string().max(max);
const money = z.number().finite().min(0).max(1e13);

export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const invoiceItemSchema = z.object({
  id: z.string().min(1).max(64),
  description: text(300),
  subDescription: text(500),
  spkRef: text(),
  qty: z.number().finite().min(0).max(1e6),
  unit: text(50),
  price: money,
});

export const invoiceDataSchema = z.object({
  fontFamily: z.enum(FONT_CHOICES),
  primaryColor: hexColor,
  senderName: text(),
  senderTitle: text(),
  senderLocation: text(),
  senderPhone: text(50),
  senderEmail: text(254),
  clientCompany: text(),
  clientPIC: text(),
  clientRole: text(),
  clientAddress: text(2000),
  clientEmail: text(254),
  invoiceNumber: z.string().trim().min(1).max(100),
  invoiceType: text(50),
  poRef: text(100),
  invoiceDate: text(50),
  dueDate: text(50),
  items: z.array(invoiceItemSchema).min(1).max(100),
  discount: money,
  taxRate: z.number().finite().min(0).max(100),
  bankName: text(100),
  accountNumber: text(50),
  accountHolder: text(),
});
