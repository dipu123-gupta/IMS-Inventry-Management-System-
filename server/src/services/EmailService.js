const nodemailer = require('nodemailer');
const config = require('../../config/env');
const logger = require('../../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
      },
    });
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('SMTP Connection Verified');
    } catch (error) {
      logger.warn('SMTP Connection Failed. Emails will not be sent.', error.message);
    }
  }

  /**
   * Universal send mail method
   */
  async sendMail({ to, subject, text, html, attachments }) {
    if (!config.EMAIL_USER || !config.EMAIL_PASS) {
      logger.warn('Email Not Sent: SMTP credentials missing');
      return;
    }

    const mailOptions = {
      from: config.FROM_EMAIL,
      to,
      subject,
      text,
      html,
      attachments,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send Welcome Email
   */
  async sendWelcomeEmail(user) {
    await this.sendMail({
      to: user.email,
      subject: 'Welcome to IMS Portal',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome, ${user.name}!</h2>
          <p>Thank you for joining IMS. Your account has been successfully created.</p>
          <p>You can now manage your inventory, orders, and more from our dashboard.</p>
          <a href="${config.CLIENT_URL}/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Dashboard</a>
        </div>
      `,
    });
  }

  /**
   * Send Order Confirmation Email
   */
  async sendOrderConfirmation(user, order) {
    await this.sendMail({
      to: user.email,
      subject: `Order Confirmation - #${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Order Confirmed!</h2>
          <p>Hi ${user.name}, your order <b>#${order.orderNumber}</b> has been placed successfully.</p>
          <p>Total Amount: <b>$${order.totalAmount}</b></p>
          <p>We'll notify you when it's shipped.</p>
        </div>
      `,
    });
  }

  /**
   * Send Password Reset Email
   */
  async sendPasswordResetEmail(user, resetUrl) {
    await this.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Requested</h2>
          <p>You requested a password reset. Please click the link below to set a new password:</p>
          <a href="${resetUrl}" style="color: blue;">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
  }
}

module.exports = new EmailService();
