import type { CartLine } from "./cart";

export type ReceiptData = {
  receiptNo: string;
  mpesaCode: string;
  date: string;
  fullName: string;
  phone: string;
  note?: string | undefined;
  lines: CartLine[];
  subtotal: number;
  packing: number;
  total: number;
};

const ksh = (n: number) => "KSh " + n.toLocaleString("en-KE", { maximumFractionDigits: 0 });

export async function downloadReceipt(data: ReceiptData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: [400, 720] });
  const W = 400;
  const orange: [number, number, number] = [240, 140, 20];

  // Header band
  doc.setFillColor(20, 18, 16);
  doc.rect(0, 0, W, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(26);
  doc.text("BLAZE", 28, 50);
  const w = doc.getTextWidth("BLAZE");
  doc.setTextColor(...orange);
  doc.text("BITES", 28 + w, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(200, 195, 190);
  doc.text("HANDCRAFTED WITH FIRE  ·  NAIROBI, KENYA", 28, 68);
  doc.text("+254 712 345 678  ·  hello@blazebites.co.ke", 28, 82);

  let y = 126;
  doc.setTextColor(30, 28, 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("PAYMENT RECEIPT", 28, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 105, 100);
  y += 16;
  doc.text(`Receipt No: ${data.receiptNo}`, 28, y);
  doc.text(`Date: ${data.date}`, 28, y + 13);
  doc.text(`M-PESA Code: ${data.mpesaCode}`, 28, y + 26);

  y += 50;
  doc.setDrawColor(228, 224, 220);
  doc.line(28, y, W - 28, y);

  y += 20;
  doc.setTextColor(30, 28, 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("CUSTOMER", 28, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(70, 66, 62);
  y += 15;
  doc.text(data.fullName, 28, y);
  y += 13;
  doc.text(data.phone, 28, y);
  if (data.note) {
    y += 13;
    doc.setTextColor(120, 115, 110);
    doc.text(doc.splitTextToSize(`Note: ${data.note}`, W - 56), 28, y);
    y += 8;
  }

  y += 22;
  doc.setDrawColor(228, 224, 220);
  doc.line(28, y, W - 28, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 28, 26);
  doc.text("ITEM", 28, y);
  doc.text("QTY", 236, y, { align: "right" });
  doc.text("AMOUNT", W - 28, y, { align: "right" });
  y += 6;
  doc.line(28, y, W - 28, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  for (const l of data.lines) {
    const nameLines: string[] = doc.splitTextToSize(l.name, 190);
    doc.setTextColor(40, 38, 36);
    doc.text(nameLines, 28, y);
    doc.text(String(l.qty), 236, y, { align: "right" });
    doc.text(ksh(l.food * l.qty), W - 28, y, { align: "right" });
    y += nameLines.length * 12;
    if (l.tin) {
      doc.setTextColor(150, 145, 140);
      doc.setFontSize(8);
      doc.text(`Packing tin  ${ksh(l.tin)} x ${l.qty}`, 34, y);
      doc.text(ksh(l.tin * l.qty), W - 28, y, { align: "right" });
      doc.setFontSize(9);
      y += 13;
    }
    y += 5;
  }

  y += 6;
  doc.setDrawColor(228, 224, 220);
  doc.line(28, y, W - 28, y);
  y += 18;
  doc.setTextColor(90, 86, 82);
  doc.text("Food subtotal", 28, y);
  doc.text(ksh(data.subtotal), W - 28, y, { align: "right" });
  y += 15;
  doc.text("Packing tins", 28, y);
  doc.text(ksh(data.packing), W - 28, y, { align: "right" });

  y += 14;
  doc.setFillColor(20, 18, 16);
  doc.rect(28, y, W - 56, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL PAID", 42, y + 24);
  doc.setTextColor(...orange);
  doc.setFontSize(13);
  doc.text(ksh(data.total), W - 42, y + 24, { align: "right" });

  y += 62;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 135, 130);
  doc.text("Paid via M-PESA STK Push (simulation). Thank you for eating with BlazeBites.", 28, y, {
    maxWidth: W - 56,
  });

  doc.save(`BlazeBites-Receipt-${data.receiptNo}.pdf`);
}
