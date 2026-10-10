import { gsConfig } from '../../gs.config';
import type { GsReceipt } from '../../types';
import { formatDateTime, formatMoneyPlain, initials } from '../format';
import { loadImageAsJpeg } from './image';

export interface ReceiptPdfBranding {
    institution: string;
    directorate: string;
    logoUrl?: string;
}

export interface ReceiptPdfResult {
    blob: Blob;
    fileName: string;
    /** false when the passport could not be embedded (the docket still generates). */
    passportIncluded: boolean;
}

const INK: [number, number, number] = [24, 30, 43];
const MUTED: [number, number, number] = [100, 110, 125];
const RULE: [number, number, number] = [214, 219, 228];
const GREEN: [number, number, number] = [21, 128, 61];

/**
 * Builds the A4 "docket" the student presents to the Directorate: passport, matric number,
 * the paid GST courses, payment reference and a clearance sign-off block.
 *
 * jsPDF/autotable are imported lazily so they never weigh down the page bundle.
 * Note: standard PDF fonts have no ₦ glyph, so money is printed as "NGN 7,500.00".
 */
export async function buildReceiptPdf(receipt: GsReceipt, branding: ReceiptPdfBranding): Promise<ReceiptPdfResult> {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

    const [passport, logo] = await Promise.all([
        loadImageAsJpeg(receipt.student.passportUrl, { width: 400, height: 500 }),
        loadImageAsJpeg(branding.logoUrl, { width: 200, height: 200 }),
    ]);

    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 15;
    const [ar, ag, ab] = gsConfig.pdfAccent;
    const student = receipt.student;
    const fullName = student.fullName ?? 'Student';

    /* ── header band ─────────────────────────────────────────────── */
    doc.setFillColor(ar, ag, ab);
    doc.rect(0, 0, W, 36, 'F');

    let textX = M;
    if (logo) {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(M, 7, 22, 22, 2, 2, 'F');
        doc.addImage(logo, 'JPEG', M + 1, 8, 20, 20);
        textX = M + 28;
    }
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold').setFontSize(15);
    doc.text(branding.institution, textX, 16);
    doc.setFont('helvetica', 'normal').setFontSize(10.5);
    doc.text(branding.directorate, textX, 22.5);
    doc.setFontSize(9.5);
    doc.text('GS course registration receipt', textX, 29);

    /* ── student block ───────────────────────────────────────────── */
    const photoW = 32;
    const photoH = 40;
    const photoX = W - M - photoW;
    const photoY = 44;

    doc.setDrawColor(...RULE).setLineWidth(0.4);
    if (passport) {
        doc.addImage(passport, 'JPEG', photoX, photoY, photoW, photoH);
    } else {
        doc.setFillColor(238, 241, 247);
        doc.rect(photoX, photoY, photoW, photoH, 'F');
        doc.setTextColor(...MUTED).setFont('helvetica', 'bold').setFontSize(18);
        doc.text(initials(fullName) || '—', photoX + photoW / 2, photoY + photoH / 2 + 2, { align: 'center' });
        doc.setFont('helvetica', 'normal').setFontSize(6.5);
        doc.text('Passport not available', photoX + photoW / 2, photoY + photoH - 4, { align: 'center' });
    }
    doc.rect(photoX, photoY, photoW, photoH);

    const rows: [string, string | undefined][] = [
        ['Full name', fullName],
        ['Matric number', student.matricNumber],
        ['Faculty', student.faculty],
        ['Department', student.department],
        ['Programme', [student.programme, student.level ? `${student.level} level` : undefined].filter(Boolean).join(' · ') || undefined],
        ['Session / semester', [receipt.session, receipt.semester].filter(Boolean).join(' · ') || undefined],
    ];
    let y = photoY + 3;
    const labelW = 38;
    const maxValueW = photoX - M - labelW - 6;
    for (const [label, value] of rows) {
        doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...MUTED);
        doc.text(label, M, y);
        doc.setFont('helvetica', label === 'Matric number' || label === 'Full name' ? 'bold' : 'normal')
            .setFontSize(label === 'Full name' ? 11 : 10)
            .setTextColor(...INK);
        const lines = doc.splitTextToSize(value ?? '—', maxValueW) as string[];
        doc.text(lines, M + labelW, y);
        y += 6.2 * Math.max(1, lines.length);
    }
    y = Math.max(y, photoY + photoH) + 6;

    /* ── payment block ───────────────────────────────────────────── */
    const boxH = 44;
    doc.setDrawColor(...RULE).setFillColor(247, 248, 251);
    doc.roundedRect(M, y, W - 2 * M, boxH, 2, 2, 'FD');

    const colW = (W - 2 * M) / 2;
    const cell = (label: string, value: string, cx: number, cy: number, color: [number, number, number] = INK, mono = false) => {
        doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED);
        doc.text(label, cx, cy);
        doc.setFont(mono ? 'courier' : 'helvetica', 'bold').setFontSize(10).setTextColor(...color);
        doc.text(value, cx, cy + 5);
    };
    const c1 = M + 5;
    const c2 = M + colW + 5;
    cell('Payment reference', receipt.reference, c1, y + 7, INK, true);
    cell('Gateway reference', receipt.gatewayReference ?? '—', c2, y + 7, INK, true);
    cell('GS fee', formatMoneyPlain(receipt.amount, receipt.currency), c1, y + 19);
    cell('Service charge', formatMoneyPlain(receipt.serviceCharge, receipt.currency), c2, y + 19);
    cell('Total paid', formatMoneyPlain(receipt.total, receipt.currency), c1, y + 31, [ar, ag, ab]);
    cell('Paid on', formatDateTime(receipt.paidAt), c2, y + 31);

    // "Verified" mark
    doc.setDrawColor(...GREEN).setTextColor(...GREEN).setLineWidth(0.6);
    doc.roundedRect(W - M - 38, y - 4.5, 34, 8, 1.5, 1.5, 'S');
    doc.setFont('helvetica', 'bold').setFontSize(8.5);
    doc.text('PAYMENT VERIFIED', W - M - 21, y + 0.7, { align: 'center' });
    doc.setLineWidth(0.4);

    y += boxH + 8;

    /* ── paid courses ────────────────────────────────────────────── */
    doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK);
    doc.text('Paid GST courses', M, y);
    const totalUnits = receipt.courses.reduce((sum, c) => sum + c.units, 0);

    autoTable(doc, {
        startY: y + 3,
        margin: { left: M, right: M, bottom: 22 },
        head: [['S/N', 'Course code', 'Course title', 'Units']],
        body: receipt.courses.map((c, i) => [String(i + 1), c.code, c.title, String(c.units)]),
        foot: [['', '', 'Total units', String(totalUnits)]],
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 2.4, textColor: INK, lineColor: RULE, lineWidth: 0.2 },
        headStyles: { fillColor: [ar, ag, ab], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [238, 241, 247], textColor: INK, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 14, halign: 'center' }, 1: { cellWidth: 32, fontStyle: 'bold' }, 3: { cellWidth: 18, halign: 'center' } },
    });
    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20) + 10;

    /* ── verification + clearance ────────────────────────────────── */
    if (y > H - 78) {
        doc.addPage();
        y = M + 5;
    }
    if (receipt.verificationCode) {
        doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED);
        doc.text('Verification code', M, y);
        doc.setFont('courier', 'bold').setFontSize(13).setTextColor(...INK);
        doc.text(receipt.verificationCode, M, y + 6.5);
        y += 14;
    }

    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...MUTED);
    const note = doc.splitTextToSize(
        `This receipt confirms that the General Studies fee was verified by the portal. Present it to the ${branding.directorate} for clearance. ` +
            'Its authenticity can be confirmed using the payment reference and verification code above.',
        W - 2 * M,
    ) as string[];
    doc.text(note, M, y);
    y += note.length * 4.2 + 8;

    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...INK);
    doc.text('For official use — Directorate clearance', M, y);
    y += 9;
    doc.setDrawColor(...MUTED).setLineWidth(0.25);
    const slot = (W - 2 * M - 12) / 3;
    ['Cleared by (name)', 'Signature', 'Date'].forEach((label, i) => {
        const x = M + i * (slot + 6);
        doc.line(x, y + 8, x + slot, y + 8);
        doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED);
        doc.text(label, x, y + 12);
    });

    /* ── footer on every page ────────────────────────────────────── */
    const pages = (doc as unknown as { getNumberOfPages(): number }).getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setDrawColor(...RULE).setLineWidth(0.3);
        doc.line(M, H - 14, W - M, H - 14);
        doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED);
        doc.text(`${branding.institution} · ${branding.directorate}`, M, H - 9.5);
        doc.text(`Generated ${formatDateTime(new Date().toISOString())} · Page ${p} of ${pages}`, W - M, H - 9.5, { align: 'right' });
    }

    const safe = (s: string) => s.replace(/[^A-Za-z0-9_-]+/g, '');
    return {
        blob: doc.output('blob'),
        fileName: `GS-Receipt_${safe(student.matricNumber ?? 'student')}_${safe(receipt.reference)}.pdf`,
        passportIncluded: Boolean(passport),
    };
}
