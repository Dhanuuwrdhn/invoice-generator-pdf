import React from 'react';
import path from 'path';
import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';
import { InvoiceData, InvoiceItem } from '@/types/invoice';
import { formatCurrency, calcSubtotal, calcTax, calcTotal } from '@/lib/format';
import { numberToWords } from '@/lib/terbilang';

const fontsDir = path.join(process.cwd(), 'public', 'fonts');

Font.register({
  family: 'Caladea',
  fonts: [
    { src: path.join(fontsDir, 'caladea-regular.ttf') },
    { src: path.join(fontsDir, 'caladea-bold.ttf'), fontWeight: 'bold' },
    { src: path.join(fontsDir, 'caladea-italic.ttf'), fontStyle: 'italic' },
    { src: path.join(fontsDir, 'caladea-bold-italic.ttf'), fontWeight: 'bold', fontStyle: 'italic' },
  ],
});

// Colors
const NAVY = '#1A3A5C';
const GRAY555 = '#555555';
const GRAY777 = '#777777';
const GRAY666 = '#666666';
const WHITE = '#FFFFFF';
const BLACK = '#1A1A1A';
const LIGHT_BG = '#F7F9FC';
const MGRAY = '#E8E8E8';
const LBLUE = '#F0F4F8';
const BADGE_BG = '#E8F4E8';
const BADGE_FG = '#2E7D32';
const GRAY333 = '#333333';

// Content width: A4 (595.28pt) - left margin (51pt) - right margin (51pt)
const CW = 493;

const s = StyleSheet.create({
  page: {
    fontFamily: 'Caladea',
    paddingLeft: 51,
    paddingRight: 51,
    paddingTop: 45,
    paddingBottom: 45,
    fontSize: 9,
    color: BLACK,
    backgroundColor: WHITE,
  },

  // ── HEADER ──
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2.5,
    borderBottomColor: NAVY,
    paddingBottom: 8,
    marginBottom: 10,
  },
  hLeft: { width: CW * 0.55 },
  hRight: { width: CW * 0.45, alignItems: 'flex-end' },
  senderName: { fontSize: 14, fontFamily: 'Caladea', fontWeight: 'bold', color: NAVY, marginBottom: 3 },
  senderTitle: { fontSize: 9, color: GRAY555, marginBottom: 2 },
  senderContact: { fontSize: 8, color: GRAY777, marginBottom: 1 },
  invTitle: { fontSize: 18, fontFamily: 'Caladea', fontWeight: 'bold', color: NAVY, marginBottom: 4 },
  invNo: { fontSize: 9, color: GRAY555, marginBottom: 5 },
  badge: { backgroundColor: BADGE_BG, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 },
  badgeText: { fontSize: 8, fontFamily: 'Caladea', fontWeight: 'bold', color: BADGE_FG },

  // ── BILL TO + META ──
  billMetaRow: { flexDirection: 'row', marginBottom: 12 },
  billBlock: { width: CW * 0.52 },
  metaBlock: { width: CW * 0.48 },
  blockLabel: {
    fontSize: 8, fontFamily: 'Caladea', fontWeight: 'bold', color: NAVY,
    borderBottomWidth: 0.8, borderBottomColor: NAVY, paddingBottom: 5, marginBottom: 5,
  },
  clientCompany: { fontSize: 10, fontFamily: 'Caladea', fontWeight: 'bold', color: BLACK, marginBottom: 2 },
  clientDetail: { fontSize: 9, color: GRAY555, marginBottom: 2, lineHeight: 1.4 },
  metaRow: { flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' },
  metaLabel: { fontSize: 9, color: GRAY777, width: 75 },
  metaColon: { fontSize: 9, color: GRAY777, width: 10 },
  metaValue: { fontSize: 9, fontFamily: 'Caladea', fontWeight: 'bold', color: BLACK, flex: 1, textAlign: 'right' },

  // ── ITEMS TABLE ──
  tHeaderRow: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    paddingTop: 8, paddingBottom: 8, paddingLeft: 6, paddingRight: 6,
  },
  tDataRow: {
    flexDirection: 'row',
    paddingTop: 8, paddingBottom: 8, paddingLeft: 6, paddingRight: 6,
    borderBottomWidth: 0.5, borderBottomColor: MGRAY,
  },
  colNo: { width: CW * 0.05 },
  colDesc: { width: CW * 0.50 },
  colQty: { width: CW * 0.08 },
  colUnit: { width: CW * 0.10 },
  colPrice: { width: CW * 0.135 },
  colAmt: { width: CW * 0.135 },
  thL: { fontSize: 8, fontFamily: 'Caladea', fontWeight: 'bold', color: WHITE },
  thC: { fontSize: 8, fontFamily: 'Caladea', fontWeight: 'bold', color: WHITE, textAlign: 'center' },
  thR: { fontSize: 8, fontFamily: 'Caladea', fontWeight: 'bold', color: WHITE, textAlign: 'right' },
  tdBold: { fontSize: 9, fontFamily: 'Caladea', fontWeight: 'bold', color: BLACK, marginBottom: 2 },
  tdSub: { fontSize: 8, color: GRAY666, lineHeight: 1.2, marginBottom: 1 },
  tdC: { fontSize: 9, color: BLACK, textAlign: 'center' },
  tdGC: { fontSize: 9, color: GRAY777, textAlign: 'center' },
  tdR: { fontSize: 9, color: BLACK, textAlign: 'right' },

  // ── TERBILANG ──
  terbBox: {
    backgroundColor: LBLUE,
    borderLeftWidth: 3.5, borderLeftColor: NAVY,
    paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
    marginTop: 10, marginBottom: 10,
  },
  terbText: { fontSize: 9, color: GRAY333 },

  // ── TOTALS ──
  totRow: {
    flexDirection: 'row',
    paddingVertical: 5, paddingHorizontal: 10,
    borderBottomWidth: 0.5, borderBottomColor: MGRAY,
  },
  totFinalRow: {
    flexDirection: 'row',
    paddingVertical: 5, paddingHorizontal: 10,
    backgroundColor: NAVY,
  },
  totLabel: { flex: 0.7, fontSize: 9, color: GRAY555 },
  totValue: { flex: 0.3, fontSize: 9, fontFamily: 'Caladea', fontWeight: 'bold', color: BLACK, textAlign: 'right' },
  totFinalLabel: { flex: 0.7, fontSize: 11, fontFamily: 'Caladea', fontWeight: 'bold', color: WHITE },
  totFinalValue: { flex: 0.3, fontSize: 11, fontFamily: 'Caladea', fontWeight: 'bold', color: WHITE, textAlign: 'right' },

  // ── PAYMENT + SIGNATURE ──
  paymentSigRow: { flexDirection: 'row', marginTop: 16, marginBottom: 14 },
  payBlock: { width: CW * 0.6 },
  sigBlock: { width: CW * 0.4, alignItems: 'center' },
  payBlockLabel: {
    fontSize: 8, fontFamily: 'Caladea', fontWeight: 'bold', color: NAVY,
    borderBottomWidth: 0.8, borderBottomColor: NAVY, paddingBottom: 5, marginBottom: 6,
  },
  payIntro: { fontSize: 9, color: GRAY555, marginBottom: 6 },
  payRow: { flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' },
  payLabel: { fontSize: 9, color: GRAY777, width: 82 },
  payColon: { fontSize: 9, color: GRAY777, width: 10 },
  payValue: { fontSize: 9, fontFamily: 'Caladea', fontWeight: 'bold', color: BLACK, flex: 1 },
  sigLabel: { fontSize: 8, color: GRAY555, textAlign: 'center', marginBottom: 2 },
  sigSpacer: { height: 40 },
  sigLine: { fontSize: 9, color: GRAY555, textAlign: 'center', marginBottom: 2 },
  sigName: { fontSize: 10, fontFamily: 'Caladea', fontWeight: 'bold', color: BLACK, textAlign: 'center', marginBottom: 2 },
  sigTitle: { fontSize: 8, color: GRAY555, textAlign: 'center' },

  // ── FOOTER ──
  footerRule: { borderBottomWidth: 0.8, borderBottomColor: MGRAY, marginBottom: 8 },
  footerText: { fontSize: 8, color: GRAY777, lineHeight: 1.5 },
});

function itemAmount(item: InvoiceItem): number {
  return item.qty * item.price;
}

interface Props {
  data: InvoiceData;
}

export function InvoicePDF({ data }: Props) {
  const subtotal = calcSubtotal(data.items);
  const taxAmt = calcTax(subtotal, data.discount, data.taxRate);
  const total = calcTotal(subtotal, data.discount, taxAmt);

  return (
    <Document title={`Invoice ${data.invoiceNumber}`}>
      <Page size="A4" style={s.page}>

        {/* 1. HEADER */}
        <View style={s.headerRow}>
          <View style={s.hLeft}>
            <Text style={s.senderName}>{data.senderName}</Text>
            <Text style={s.senderTitle}>{data.senderTitle}</Text>
            <Text style={s.senderContact}>{data.senderLocation}</Text>
            <Text style={s.senderContact}>{data.senderPhone}  |  {data.senderEmail}</Text>
          </View>
          <View style={s.hRight}>
            <Text style={s.invTitle}>INVOICE</Text>
            <Text style={s.invNo}>No. {data.invoiceNumber}</Text>
            {data.invoiceType ? (
              <View style={s.badge}>
                <Text style={s.badgeText}>{data.invoiceType}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* 2. BILL TO + META */}
        <View style={s.billMetaRow}>
          <View style={s.billBlock}>
            <Text style={s.blockLabel}>DITAGIHKAN KEPADA</Text>
            <Text style={s.clientCompany}>{data.clientCompany}</Text>
            {data.clientPIC ? (
              <Text style={s.clientDetail}>
                {data.clientPIC}{data.clientRole ? ` — ${data.clientRole}` : ''}
              </Text>
            ) : null}
            {data.clientAddress ? <Text style={s.clientDetail}>{data.clientAddress}</Text> : null}
            {data.clientEmail ? <Text style={s.clientDetail}>{data.clientEmail}</Text> : null}
          </View>
          <View style={s.metaBlock}>
            <MetaRow label="No. Invoice" value={data.invoiceNumber} />
            {data.poRef ? <MetaRow label="Ref. PO/WO" value={data.poRef} /> : null}
            <MetaRow label="Tgl. Invoice" value={data.invoiceDate} />
            <MetaRow label="Jatuh Tempo" value={data.dueDate} />
          </View>
        </View>

        {/* 3. ITEMS TABLE */}
        <View>
          <View style={s.tHeaderRow}>
            <View style={s.colNo}><Text style={s.thC}>NO</Text></View>
            <View style={s.colDesc}><Text style={s.thL}>DESKRIPSI LAYANAN</Text></View>
            <View style={s.colQty}><Text style={s.thC}>QTY</Text></View>
            <View style={s.colUnit}><Text style={s.thC}>UNIT</Text></View>
            <View style={s.colPrice}><Text style={s.thR}>HARGA (RP)</Text></View>
            <View style={s.colAmt}><Text style={s.thR}>JUMLAH (RP)</Text></View>
          </View>
          {data.items.map((item, i) => (
            <View
              key={item.id}
              style={[s.tDataRow, { backgroundColor: i % 2 === 0 ? LIGHT_BG : WHITE }]}
            >
              <View style={s.colNo}><Text style={s.tdGC}>{i + 1}</Text></View>
              <View style={s.colDesc}>
                <Text style={s.tdBold}>{item.description}</Text>
                {item.subDescription ? <Text style={s.tdSub}>{item.subDescription}</Text> : null}
                {item.spkRef ? <Text style={s.tdSub}>{item.spkRef}</Text> : null}
              </View>
              <View style={s.colQty}><Text style={s.tdC}>{item.qty}</Text></View>
              <View style={s.colUnit}><Text style={s.tdC}>{item.unit}</Text></View>
              <View style={s.colPrice}><Text style={s.tdR}>{formatCurrency(item.price)}</Text></View>
              <View style={s.colAmt}><Text style={s.tdR}>{formatCurrency(itemAmount(item))}</Text></View>
            </View>
          ))}
        </View>

        {/* 4. TERBILANG */}
        <View style={s.terbBox}>
          <Text style={s.terbText}>Terbilang: &quot;{numberToWords(total)}&quot;</Text>
        </View>

        {/* 5. TOTALS */}
        <View>
          <View style={s.totRow}>
            <Text style={s.totLabel}>Subtotal</Text>
            <Text style={s.totValue}>Rp {formatCurrency(subtotal)}</Text>
          </View>
          <View style={s.totRow}>
            <Text style={s.totLabel}>Diskon</Text>
            <Text style={s.totValue}>Rp {formatCurrency(data.discount)}</Text>
          </View>
          <View style={s.totRow}>
            <Text style={s.totLabel}>Pajak ({data.taxRate}%)</Text>
            <Text style={s.totValue}>Rp {formatCurrency(taxAmt)}</Text>
          </View>
          <View style={s.totFinalRow}>
            <Text style={s.totFinalLabel}>Total Tagihan</Text>
            <Text style={s.totFinalValue}>Rp {formatCurrency(total)}</Text>
          </View>
        </View>

        {/* 6. PAYMENT + SIGNATURE */}
        <View style={s.paymentSigRow}>
          <View style={s.payBlock}>
            <Text style={s.payBlockLabel}>INSTRUKSI PEMBAYARAN</Text>
            <Text style={s.payIntro}>Mohon lakukan transfer pembayaran ke rekening berikut:</Text>
            <View style={s.payRow}>
              <Text style={s.payLabel}>Nama Bank</Text>
              <Text style={s.payColon}>:</Text>
              <Text style={s.payValue}>{data.bankName}</Text>
            </View>
            <View style={s.payRow}>
              <Text style={s.payLabel}>No. Rekening</Text>
              <Text style={s.payColon}>:</Text>
              <Text style={s.payValue}>{data.accountNumber}</Text>
            </View>
            <View style={s.payRow}>
              <Text style={s.payLabel}>Atas Nama</Text>
              <Text style={s.payColon}>:</Text>
              <Text style={s.payValue}>{data.accountHolder || data.senderName}</Text>
            </View>
          </View>
          <View style={s.sigBlock}>
            <Text style={s.sigLabel}>Hormat Kami,</Text>
            <View style={s.sigSpacer} />
            <Text style={s.sigLine}>─────────────────</Text>
            <Text style={s.sigName}>{data.senderName}</Text>
            <Text style={s.sigTitle}>{data.senderTitle}</Text>
          </View>
        </View>

        {/* 7. FOOTER */}
        <View style={s.footerRule} />
        <Text style={s.footerText}>
          Terima kasih atas kepercayaan dan kerja sama Anda.{'\n'}
          Jika ada pertanyaan terkait invoice ini, silakan hubungi kami melalui WhatsApp{' '}
          {data.senderPhone} atau email {data.senderEmail}
        </Text>

      </Page>
    </Document>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metaRow}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaColon}>:</Text>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  );
}
