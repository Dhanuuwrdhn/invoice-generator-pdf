import React from 'react';
import path from 'path';
import { Document, Page, View, Text, Font } from '@react-pdf/renderer';
import { InvoiceData, InvoiceItem, FontChoice } from '@/types/invoice';
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

Font.register({
  family: 'Lato',
  fonts: [
    { src: path.join(fontsDir, 'lato-regular.ttf') },
    { src: path.join(fontsDir, 'lato-bold.ttf'), fontWeight: 'bold' },
    { src: path.join(fontsDir, 'lato-italic.ttf'), fontStyle: 'italic' },
    { src: path.join(fontsDir, 'lato-bold-italic.ttf'), fontWeight: 'bold', fontStyle: 'italic' },
  ],
});

Font.register({
  family: 'Montserrat',
  fonts: [
    { src: path.join(fontsDir, 'montserrat-regular.ttf') },
    { src: path.join(fontsDir, 'montserrat-bold.ttf'), fontWeight: 'bold' },
    { src: path.join(fontsDir, 'montserrat-italic.ttf'), fontStyle: 'italic' },
    { src: path.join(fontsDir, 'montserrat-bold-italic.ttf'), fontWeight: 'bold', fontStyle: 'italic' },
  ],
});

// Colors
const NAVY    = '#1A3A5C';
const G555    = '#555555';
const G777    = '#777777';
const G666    = '#666666';
const WHITE   = '#FFFFFF';
const BLACK   = '#1A1A1A';
const LIGHT   = '#F7F9FC';
const MGRAY   = '#E8E8E8';
const LBLUE   = '#F0F4F8';
const BADGEBG = '#E8F4E8';
const BADGEFG = '#2E7D32';
const G333    = '#333333';

const CW = 493;

function buildStyles(f: FontChoice) {
  const B = { fontFamily: f, fontWeight: 'bold' } as const;
  return {
    page:       { fontFamily: f, paddingLeft: 51, paddingRight: 51, paddingTop: 45, paddingBottom: 45, fontSize: 9, color: BLACK, backgroundColor: WHITE },
    // header
    headerRow:  { flexDirection: 'row' as const, borderBottomWidth: 2.5, borderBottomColor: NAVY, paddingBottom: 8, marginBottom: 10 },
    hLeft:      { width: CW * 0.55 },
    hRight:     { width: CW * 0.45, alignItems: 'flex-end' as const },
    senderName: { ...B, fontSize: 14, color: NAVY, marginBottom: 3 },
    senderTitle:{ fontFamily: f, fontSize: 9, color: G555, marginBottom: 2 },
    senderCtc:  { fontFamily: f, fontSize: 8, color: G777, marginBottom: 1 },
    invTitle:   { ...B, fontSize: 18, color: NAVY, marginBottom: 4 },
    invNo:      { fontFamily: f, fontSize: 9, color: G555, marginBottom: 5 },
    badge:      { backgroundColor: BADGEBG, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 },
    badgeText:  { ...B, fontSize: 8, color: BADGEFG },
    // bill + meta
    billMetaRow:{ flexDirection: 'row' as const, marginBottom: 12 },
    billBlock:  { width: CW * 0.52 },
    metaBlock:  { width: CW * 0.48 },
    blockLabel: { ...B, fontSize: 8, color: NAVY, borderBottomWidth: 0.8, borderBottomColor: NAVY, paddingBottom: 5, marginBottom: 5 },
    clientCo:   { ...B, fontSize: 10, color: BLACK, marginBottom: 2 },
    clientDtl:  { fontFamily: f, fontSize: 9, color: G555, marginBottom: 2, lineHeight: 1.4 },
    metaRow:    { flexDirection: 'row' as const, marginBottom: 3 },
    metaLbl:    { fontFamily: f, fontSize: 9, color: G777, width: 75 },
    metaColon:  { fontFamily: f, fontSize: 9, color: G777, width: 10 },
    metaVal:    { ...B, fontSize: 9, color: BLACK, flex: 1, textAlign: 'right' as const },
    // table
    tHdr:       { flexDirection: 'row' as const, backgroundColor: NAVY, paddingTop: 8, paddingBottom: 8, paddingLeft: 6, paddingRight: 6 },
    tRow:       { flexDirection: 'row' as const, paddingTop: 8, paddingBottom: 8, paddingLeft: 6, paddingRight: 6, borderBottomWidth: 0.5, borderBottomColor: MGRAY },
    colNo:      { width: CW * 0.05 },
    colDesc:    { width: CW * 0.50 },
    colQty:     { width: CW * 0.08 },
    colUnit:    { width: CW * 0.10 },
    colPrice:   { width: CW * 0.135 },
    colAmt:     { width: CW * 0.135 },
    thL:        { ...B, fontSize: 8, color: WHITE },
    thC:        { ...B, fontSize: 8, color: WHITE, textAlign: 'center' as const },
    thR:        { ...B, fontSize: 8, color: WHITE, textAlign: 'right' as const },
    tdBold:     { ...B, fontSize: 9, color: BLACK, marginBottom: 2 },
    tdSub:      { fontFamily: f, fontSize: 8, color: G666, lineHeight: 1.2, marginBottom: 1 },
    tdC:        { fontFamily: f, fontSize: 9, color: BLACK, textAlign: 'center' as const },
    tdGC:       { fontFamily: f, fontSize: 9, color: G777, textAlign: 'center' as const },
    tdR:        { fontFamily: f, fontSize: 9, color: BLACK, textAlign: 'right' as const },
    // terbilang
    terbBox:    { backgroundColor: LBLUE, borderLeftWidth: 3.5, borderLeftColor: NAVY, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, marginTop: 10, marginBottom: 10 },
    terbTxt:    { fontFamily: f, fontSize: 9, color: G333 },
    // totals
    totRow:     { flexDirection: 'row' as const, paddingVertical: 5, paddingHorizontal: 10, borderBottomWidth: 0.5, borderBottomColor: MGRAY },
    totFinal:   { flexDirection: 'row' as const, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: NAVY },
    totLbl:     { fontFamily: f, flex: 0.7, fontSize: 9, color: G555 },
    totVal:     { ...B, flex: 0.3, fontSize: 9, color: BLACK, textAlign: 'right' as const },
    totFLbl:    { ...B, flex: 0.7, fontSize: 11, color: WHITE },
    totFVal:    { ...B, flex: 0.3, fontSize: 11, color: WHITE, textAlign: 'right' as const },
    // payment + sig
    paySigRow:  { flexDirection: 'row' as const, marginTop: 16, marginBottom: 14 },
    payBlock:   { width: CW * 0.6 },
    sigBlock:   { width: CW * 0.4, alignItems: 'center' as const },
    payBLabel:  { ...B, fontSize: 8, color: NAVY, borderBottomWidth: 0.8, borderBottomColor: NAVY, paddingBottom: 5, marginBottom: 6 },
    payIntro:   { fontFamily: f, fontSize: 9, color: G555, marginBottom: 6 },
    payRow:     { flexDirection: 'row' as const, marginBottom: 3 },
    payLbl:     { fontFamily: f, fontSize: 9, color: G777, width: 82 },
    payColon:   { fontFamily: f, fontSize: 9, color: G777, width: 10 },
    payVal:     { ...B, fontSize: 9, color: BLACK, flex: 1 },
    sigLbl:     { fontFamily: f, fontSize: 8, color: G555, textAlign: 'center' as const, marginBottom: 2 },
    sigSpacer:  { height: 40 },
    sigLine:    { fontFamily: f, fontSize: 9, color: G555, textAlign: 'center' as const, marginBottom: 2 },
    sigName:    { ...B, fontSize: 10, color: BLACK, textAlign: 'center' as const, marginBottom: 2 },
    sigTitle:   { fontFamily: f, fontSize: 8, color: G555, textAlign: 'center' as const },
    // footer
    footerRule: { borderBottomWidth: 0.8, borderBottomColor: MGRAY, marginBottom: 8 },
    footerTxt:  { fontFamily: f, fontSize: 8, color: G777, lineHeight: 1.5 },
  };
}

function itemAmt(item: InvoiceItem) { return item.qty * item.price; }

export function InvoicePDF({ data }: { data: InvoiceData }) {
  const s = buildStyles(data.fontFamily || 'Caladea');
  const subtotal = calcSubtotal(data.items);
  const taxAmt   = calcTax(subtotal, data.discount, data.taxRate);
  const total    = calcTotal(subtotal, data.discount, taxAmt);

  return (
    <Document title={`Invoice ${data.invoiceNumber}`}>
      <Page size="A4" style={s.page}>

        {/* 1. HEADER */}
        <View style={s.headerRow}>
          <View style={s.hLeft}>
            <Text style={s.senderName}>{data.senderName}</Text>
            <Text style={s.senderTitle}>{data.senderTitle}</Text>
            <Text style={s.senderCtc}>{data.senderLocation}</Text>
            <Text style={s.senderCtc}>{data.senderPhone}  |  {data.senderEmail}</Text>
          </View>
          <View style={s.hRight}>
            <Text style={s.invTitle}>INVOICE</Text>
            <Text style={s.invNo}>No. {data.invoiceNumber}</Text>
            {data.invoiceType ? (
              <View style={s.badge}><Text style={s.badgeText}>{data.invoiceType}</Text></View>
            ) : null}
          </View>
        </View>

        {/* 2. BILL TO + META */}
        <View style={s.billMetaRow}>
          <View style={s.billBlock}>
            <Text style={s.blockLabel}>DITAGIHKAN KEPADA</Text>
            <Text style={s.clientCo}>{data.clientCompany}</Text>
            {data.clientPIC ? (
              <Text style={s.clientDtl}>{data.clientPIC}{data.clientRole ? ` — ${data.clientRole}` : ''}</Text>
            ) : null}
            {data.clientAddress ? <Text style={s.clientDtl}>{data.clientAddress}</Text> : null}
            {data.clientEmail   ? <Text style={s.clientDtl}>{data.clientEmail}</Text>   : null}
          </View>
          <View style={s.metaBlock}>
            <MetaRow s={s} label="No. Invoice"  value={data.invoiceNumber} />
            {data.poRef ? <MetaRow s={s} label="Ref. PO/WO" value={data.poRef} /> : null}
            <MetaRow s={s} label="Tgl. Invoice" value={data.invoiceDate} />
            <MetaRow s={s} label="Jatuh Tempo"  value={data.dueDate} />
          </View>
        </View>

        {/* 3. ITEMS TABLE */}
        <View>
          <View style={s.tHdr}>
            <View style={s.colNo}>   <Text style={s.thC}>NO</Text></View>
            <View style={s.colDesc}> <Text style={s.thL}>DESKRIPSI LAYANAN</Text></View>
            <View style={s.colQty}>  <Text style={s.thC}>QTY</Text></View>
            <View style={s.colUnit}> <Text style={s.thC}>UNIT</Text></View>
            <View style={s.colPrice}><Text style={s.thR}>HARGA (RP)</Text></View>
            <View style={s.colAmt}>  <Text style={s.thR}>JUMLAH (RP)</Text></View>
          </View>
          {data.items.map((item, i) => (
            <View key={item.id} style={[s.tRow, { backgroundColor: i % 2 === 0 ? LIGHT : WHITE }]}>
              <View style={s.colNo}>   <Text style={s.tdGC}>{i + 1}</Text></View>
              <View style={s.colDesc}>
                <Text style={s.tdBold}>{item.description}</Text>
                {item.subDescription ? <Text style={s.tdSub}>{item.subDescription}</Text> : null}
                {item.spkRef         ? <Text style={s.tdSub}>{item.spkRef}</Text>         : null}
              </View>
              <View style={s.colQty}>  <Text style={s.tdC}>{item.qty}</Text></View>
              <View style={s.colUnit}> <Text style={s.tdC}>{item.unit}</Text></View>
              <View style={s.colPrice}><Text style={s.tdR}>{formatCurrency(item.price)}</Text></View>
              <View style={s.colAmt}>  <Text style={s.tdR}>{formatCurrency(itemAmt(item))}</Text></View>
            </View>
          ))}
        </View>

        {/* 4. TERBILANG */}
        <View style={s.terbBox}>
          <Text style={s.terbTxt}>Terbilang: &quot;{numberToWords(total)}&quot;</Text>
        </View>

        {/* 5. TOTALS */}
        <View>
          <View style={s.totRow}><Text style={s.totLbl}>Subtotal</Text><Text style={s.totVal}>Rp {formatCurrency(subtotal)}</Text></View>
          <View style={s.totRow}><Text style={s.totLbl}>Diskon</Text><Text style={s.totVal}>Rp {formatCurrency(data.discount)}</Text></View>
          <View style={s.totRow}><Text style={s.totLbl}>Pajak ({data.taxRate}%)</Text><Text style={s.totVal}>Rp {formatCurrency(taxAmt)}</Text></View>
          <View style={s.totFinal}><Text style={s.totFLbl}>Total Tagihan</Text><Text style={s.totFVal}>Rp {formatCurrency(total)}</Text></View>
        </View>

        {/* 6. PAYMENT + SIGNATURE */}
        <View style={s.paySigRow}>
          <View style={s.payBlock}>
            <Text style={s.payBLabel}>INSTRUKSI PEMBAYARAN</Text>
            <Text style={s.payIntro}>Mohon lakukan transfer pembayaran ke rekening berikut:</Text>
            <View style={s.payRow}><Text style={s.payLbl}>Nama Bank</Text><Text style={s.payColon}>:</Text><Text style={s.payVal}>{data.bankName}</Text></View>
            <View style={s.payRow}><Text style={s.payLbl}>No. Rekening</Text><Text style={s.payColon}>:</Text><Text style={s.payVal}>{data.accountNumber}</Text></View>
            <View style={s.payRow}><Text style={s.payLbl}>Atas Nama</Text><Text style={s.payColon}>:</Text><Text style={s.payVal}>{data.accountHolder || data.senderName}</Text></View>
          </View>
          <View style={s.sigBlock}>
            <Text style={s.sigLbl}>Hormat Kami,</Text>
            <View style={s.sigSpacer} />
            <Text style={s.sigLine}>─────────────────</Text>
            <Text style={s.sigName}>{data.senderName}</Text>
            <Text style={s.sigTitle}>{data.senderTitle}</Text>
          </View>
        </View>

        {/* 7. FOOTER */}
        <View style={s.footerRule} />
        <Text style={s.footerTxt}>
          Terima kasih atas kepercayaan dan kerja sama Anda.{'\n'}
          Jika ada pertanyaan terkait invoice ini, silakan hubungi kami melalui WhatsApp{' '}
          {data.senderPhone} atau email {data.senderEmail}
        </Text>

      </Page>
    </Document>
  );
}

function MetaRow({ s, label, value }: { s: ReturnType<typeof buildStyles>; label: string; value: string }) {
  return (
    <View style={s.metaRow}>
      <Text style={s.metaLbl}>{label}</Text>
      <Text style={s.metaColon}>:</Text>
      <Text style={s.metaVal}>{value}</Text>
    </View>
  );
}
