// server/services/pdfService.js
const PDFDocument = require('pdfkit');

function generateInvoicePDF(invoiceData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            let buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Header
            doc.fillColor('#2D6A4F')
               .fontSize(24)
               .text('FarmSense AI', 50, 50);
            
            doc.fillColor('#444444')
               .fontSize(10)
               .text('Smart Farming Assistant', 50, 75);

            doc.fontSize(20)
               .fillColor('#333333')
               .text('INVOICE / BOOKING CONFIRMATION', 50, 120, { align: 'right' });

            // Invoice details
            doc.fontSize(10)
               .text(`Invoice Number: FS-${invoiceData.inspection_id}`, 50, 160, { align: 'right' })
               .text(`Date: ${new Date().toLocaleDateString()}`, 50, 175, { align: 'right' });

            doc.moveTo(50, 200).lineTo(550, 200).strokeColor('#eeeeee').stroke();

            // Customer details
            doc.fontSize(14)
               .fillColor('#2D6A4F')
               .text('Billed To:', 50, 220);
            
            doc.fontSize(10)
               .fillColor('#444444')
               .text(invoiceData.customer_name, 50, 240)
               .text(invoiceData.customer_email, 50, 255)
               .text(`Farm: ${invoiceData.farm_name}`, 50, 270);

            // Table Header
            doc.moveTo(50, 310).lineTo(550, 310).strokeColor('#2D6A4F').stroke();
            doc.fontSize(12)
               .fillColor('#2D6A4F')
               .text('Description', 50, 320)
               .text('Amount', 450, 320, { width: 100, align: 'right' });
            doc.moveTo(50, 340).lineTo(550, 340).strokeColor('#2D6A4F').stroke();

            // Table Body
            doc.fontSize(10)
               .fillColor('#333333')
               .text(`Professional Soil Inspection Service`, 50, 360)
               .text(`Preferred Date: ${new Date(invoiceData.preferred_date).toLocaleDateString()}`, 50, 375, { color: '#888' })
               .text(`₹${invoiceData.amount}`, 450, 360, { width: 100, align: 'right' });

            doc.moveTo(50, 410).lineTo(550, 410).strokeColor('#eeeeee').stroke();

            // Total
            doc.fontSize(14)
               .fillColor('#2D6A4F')
               .text('Total Paid:', 350, 430)
               .text(`₹${invoiceData.amount}`, 450, 430, { width: 100, align: 'right' });

            // Footer
            doc.fontSize(10)
               .fillColor('#888888')
               .text('Thank you for choosing FarmSense AI. Our agronomy team will contact you soon to finalize the visit time.', 50, 680, { align: 'center', width: 500 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateInvoicePDF
};
