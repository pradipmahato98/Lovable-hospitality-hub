import { jsPDF } from "jspdf";
import { Invoice } from "@/hooks/useFinanceExtended";
import { format } from "date-fns";

export const generateInvoicePdf = (invoice: Invoice) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const gold = [191, 155, 48]; // Approximate gold
  const navy = [6, 12, 26];

  // Header
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("LuxeStay ERP", 20, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Luxury Property Management", 20, 32);

  doc.setFontSize(20);
  doc.text("INVOICE", pageWidth - 20, 25, { align: "right" });
  doc.setFontSize(12);
  doc.text(invoice.invoice_number, pageWidth - 20, 32, { align: "right" });

  // Bill To / Invoice Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 20, 60);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.guest ? `${invoice.guest.first_name} ${invoice.guest.last_name}` : "Valued Guest", 20, 67);

  doc.setFont("helvetica", "bold");
  doc.text("Date:", pageWidth - 80, 60);
  doc.text("Due Date:", pageWidth - 80, 67);
  doc.text("Status:", pageWidth - 80, 74);

  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(invoice.invoice_date), "MMM dd, yyyy"), pageWidth - 20, 60, { align: "right" });
  doc.text(invoice.due_date ? format(new Date(invoice.due_date), "MMM dd, yyyy") : "-", pageWidth - 20, 67, { align: "right" });
  doc.text(invoice.status.toUpperCase(), pageWidth - 20, 74, { align: "right" });

  // Items Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(20, 90, pageWidth - 40, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Description", 25, 96);
  doc.text("Qty", pageWidth - 80, 96, { align: "right" });
  doc.text("Price", pageWidth - 50, 96, { align: "right" });
  doc.text("Total", pageWidth - 25, 96, { align: "right" });

  // Items
  let y = 106;
  doc.setFont("helvetica", "normal");
  if (invoice.items && invoice.items.length > 0) {
    invoice.items.forEach((item) => {
      doc.text(item.description, 25, y);
      doc.text(item.quantity.toString(), pageWidth - 80, y, { align: "right" });
      doc.text(`$${item.unit_price.toFixed(2)}`, pageWidth - 50, y, { align: "right" });
      doc.text(`$${item.total.toFixed(2)}`, pageWidth - 25, y, { align: "right" });
      y += 10;
    });
  } else {
    doc.text("Stay Charges", 25, y);
    doc.text("1", pageWidth - 80, y, { align: "right" });
    doc.text(`$${invoice.total.toFixed(2)}`, pageWidth - 50, y, { align: "right" });
    doc.text(`$${invoice.total.toFixed(2)}`, pageWidth - 25, y, { align: "right" });
    y += 10;
  }

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y + 5, pageWidth - 20, y + 5);
  y += 15;

  // Totals
  doc.setFont("helvetica", "bold");
  doc.text("Subtotal:", pageWidth - 80, y);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, pageWidth - 25, y, { align: "right" });
  y += 8;

  doc.text("Tax:", pageWidth - 80, y);
  doc.text(`$${invoice.tax_amount.toFixed(2)}`, pageWidth - 25, y, { align: "right" });
  y += 8;

  if (invoice.discount_amount > 0) {
    doc.text("Discount:", pageWidth - 80, y);
    doc.text(`-$${invoice.discount_amount.toFixed(2)}`, pageWidth - 25, y, { align: "right" });
    y += 8;
  }

  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(pageWidth - 90, y - 5, 70, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL:", pageWidth - 80, y + 3);
  doc.text(`$${invoice.total.toFixed(2)}`, pageWidth - 25, y + 3, { align: "right" });

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(10);
  doc.text("Thank you for choosing LuxeStay ERP", pageWidth / 2, 280, { align: "center" });

  doc.save(`${invoice.invoice_number}.pdf`);
};
