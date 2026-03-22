const PDFDocument = require('pdfkit');
const OrderRepository = require('../src/repositories/OrderRepository');
const OrganizationRepository = require('../src/repositories/OrganizationRepository');
const logger = require('../utils/logger');

/**
 * Generate PDF Invoice for an order
 * @param {Object} order - Order document
 * @param {Object} res - Express response object
 */
exports.generateInvoice = async (orderId, organizationId, res) => {
  try {
    const order = await OrderRepository.model.findOne({ _id: orderId, organization: organizationId })
       .populate('items.product', 'name sku')
       .populate('customer', 'name email address phone')
       .populate('vendor', 'name email address phone');

    if (!order) throw new Error('Order not found');

    const org = await OrganizationRepository.findById(organizationId);
    const currencySymbol = org?.settings?.currency === 'INR' ? 'Rs.' : (org?.settings?.currency || '$');
    // Note: getCurrencySymbol logic can be more robust, but for PDF we'll use simple mapping or the code itself if symbol not found.
    // For now let's use a helper or the currency code.
    const currency = org?.settings?.currency || 'USD';

    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);

    doc.pipe(res);

    // Header
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text(org?.name?.toUpperCase() || 'INVOICE', 110, 57)
      .fontSize(10)
      .text(org?.settings?.address || '', 200, 65, { align: 'right' })
      .moveDown();

    // Line
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 115).lineTo(550, 115).stroke();

    // Order Info
    doc
      .fontSize(10)
      .text(`Invoice Number: ${order.orderNumber}`, 50, 130)
      .text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 145)
      .text(`Status: ${order.status.toUpperCase()}`, 50, 160)
      .moveDown();

    // Customer/Supplier Info
    const entityTitle = order.type === 'sale' ? 'Bill To:' : 'Supplier:';
    const entity = order.type === 'sale' ? order.customer : order.vendor;

    if (entity) {
      doc
        .fontSize(12)
        .text(entityTitle, 50, 190)
        .fontSize(10)
        .text(entity.name || order.customerName || 'N/A', 50, 205)
        .text(entity.address || 'N/A', 50, 220)
        .text(entity.email || order.customerEmail || 'N/A', 50, 235);
    }

    // Table Header
    const tableTop = 280;
    doc.fillColor('#444444').fontSize(10);
    doc.text('Item', 50, tableTop);
    doc.text('SKU', 150, tableTop);
    doc.text('Quantity', 250, tableTop, { width: 90, align: 'right' });
    doc.text('Price', 350, tableTop, { width: 90, align: 'right' });
    doc.text('Total', 450, tableTop, { width: 90, align: 'right' });

    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table Content
    let i = 0;
    order.items.forEach((item) => {
      const y = tableTop + 30 + i * 25;
      doc.text(item.product.name, 50, y);
      doc.text(item.product.sku, 150, y);
      doc.text(item.quantity.toString(), 250, y, { width: 90, align: 'right' });
      doc.text(`${currency} ${item.price.toFixed(2)}`, 350, y, { width: 90, align: 'right' });
      doc.text(`${currency} ${(item.quantity * item.price).toFixed(2)}`, 450, y, { width: 90, align: 'right' });
      i++;
    });

    // Summary
    const subtotalOver = tableTop + 30 + i * 25 + 20;
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(350, subtotalOver).lineTo(550, subtotalOver).stroke();

    const summaryY = subtotalOver + 15;
    
    // Subtotal
    doc
      .fontSize(10)
      .text('Subtotal:', 350, summaryY)
      .text(`${currency} ${order.subtotal.toFixed(2)}`, 450, summaryY, { width: 90, align: 'right' });

    // Discount
    if (order.discount > 0) {
      doc
        .text('Discount:', 350, summaryY + 15)
        .text(`-${currency} ${order.discount.toFixed(2)}`, 450, summaryY + 15, { width: 90, align: 'right' });
    }

    // Tax
    doc
      .text(`Tax (${order.taxRate}%):`, 350, summaryY + 30)
      .text(`${currency} ${order.taxAmount.toFixed(2)}`, 450, summaryY + 30, { width: 90, align: 'right' });

    // Grand Total
    doc
      .fontSize(12)
      .fillColor('#000000')
      .text('Grand Total:', 350, summaryY + 50)
      .text(`${currency} ${order.totalAmount.toFixed(2)}`, 450, summaryY + 50, { width: 90, align: 'right' });

    // Footer
    doc
      .fontSize(10)
      .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

    doc.end();
  } catch (error) {
    logger.error('PDF Generation Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Could not generate invoice' });
    }
  }
};

/**
 * Generate PDF Invoice and return as Buffer (for email attachments)
 * @param {string} orderId 
 * @param {string} organizationId 
 * @returns {Promise<Buffer>}
 */
exports.generateInvoiceBuffer = async (orderId, organizationId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const order = await OrderRepository.model.findOne({ _id: orderId, organization: organizationId })
        .populate('items.product', 'name sku')
        .populate('customer', 'name email address phone')
        .populate('vendor', 'name email address phone');

      if (!order) throw new Error('Order not found');

      const org = await OrganizationRepository.findById(organizationId);
      const currency = org?.settings?.currency || 'USD';

      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        let pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc
        .fillColor('#444444')
        .fontSize(20)
        .text(org?.name?.toUpperCase() || 'INVOICE', 110, 57)
        .fontSize(10)
        .text(org?.settings?.address || '', 200, 65, { align: 'right' })
        .moveDown();

      // Line
      doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 115).lineTo(550, 115).stroke();

      // Order Info
      doc
        .fontSize(10)
        .text(`Invoice Number: ${order.orderNumber}`, 50, 130)
        .text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 145)
        .text(`Status: ${order.status.toUpperCase()}`, 50, 160)
        .moveDown();

      // Customer/Supplier Info
      const entityTitle = order.type === 'sale' ? 'Bill To:' : 'Supplier:';
      const entity = order.type === 'sale' ? order.customer : order.vendor;

      if (entity) {
        doc
          .fontSize(12)
          .text(entityTitle, 50, 190)
          .fontSize(10)
          .text(entity.name || order.customerName || 'N/A', 50, 205)
          .text(entity.address || 'N/A', 50, 220)
          .text(entity.email || order.customerEmail || 'N/A', 50, 235);
      }

      // Table Header
      const tableTop = 280;
      doc.fillColor('#444444').fontSize(10);
      doc.text('Item', 50, tableTop);
      doc.text('SKU', 150, tableTop);
      doc.text('Quantity', 250, tableTop, { width: 90, align: 'right' });
      doc.text('Price', 350, tableTop, { width: 90, align: 'right' });
      doc.text('Total', 450, tableTop, { width: 90, align: 'right' });

      doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table Content
      let i = 0;
      order.items.forEach((item) => {
        const y = tableTop + 30 + i * 25;
        doc.text(item.product.name, 50, y);
        doc.text(item.product.sku, 150, y);
        doc.text(item.quantity.toString(), 250, y, { width: 90, align: 'right' });
        doc.text(`${currency} ${item.price.toFixed(2)}`, 350, y, { width: 90, align: 'right' });
        doc.text(`${currency} ${(item.quantity * item.price).toFixed(2)}`, 450, y, { width: 90, align: 'right' });
        i++;
      });

      // Summary
      const subtotalOver = tableTop + 30 + i * 25 + 20;
      doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(350, subtotalOver).lineTo(550, subtotalOver).stroke();

      const summaryY = subtotalOver + 15;
      
      // Subtotal
      doc
        .fontSize(10)
        .text('Subtotal:', 350, summaryY)
        .text(`${currency} ${order.subtotal.toFixed(2)}`, 450, summaryY, { width: 90, align: 'right' });

      // Discount
      if (order.discount > 0) {
        doc
          .text('Discount:', 350, summaryY + 15)
          .text(`-${currency} ${order.discount.toFixed(2)}`, 450, summaryY + 15, { width: 90, align: 'right' });
      }

      // Tax
      doc
        .text(`Tax (${order.taxRate}%):`, 350, summaryY + 30)
        .text(`${currency} ${order.taxAmount.toFixed(2)}`, 450, summaryY + 30, { width: 90, align: 'right' });

      // Grand Total
      doc
        .fontSize(12)
        .fillColor('#000000')
        .text('Grand Total:', 350, summaryY + 50)
        .text(`${currency} ${order.totalAmount.toFixed(2)}`, 450, summaryY + 50, { width: 90, align: 'right' });

      // Footer
      doc
        .fontSize(10)
        .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
