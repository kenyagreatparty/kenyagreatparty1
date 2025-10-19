const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email configuration not found. Skipping email send.');
      return { success: false, message: 'Email configuration not found' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send bulk email function
const sendBulkEmail = async (recipients, subject, html, text) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email configuration not found. Skipping bulk email send.');
      return { success: false, message: 'Email configuration not found' };
    }

    const transporter = createTransporter();
    const results = [];

    for (const recipient of recipients) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: recipient.email,
          subject: subject.replace('{{name}}', recipient.name || ''),
          html: html.replace('{{name}}', recipient.name || ''),
          text: text ? text.replace('{{name}}', recipient.name || '') : html.replace(/<[^>]*>/g, '')
        };

        const info = await transporter.sendMail(mailOptions);
        results.push({ email: recipient.email, success: true, messageId: info.messageId });
      } catch (error) {
        results.push({ email: recipient.email, success: false, error: error.message });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Bulk email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to Kenya Great Party!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ADD8E6;">Welcome to Kenya Great Party!</h2>
        <p>Dear ${name},</p>
        <p>Welcome to the Kenya Great Party family! We're excited to have you join us in our mission to build a better Kenya.</p>
        <p>As a member, you'll have access to:</p>
        <ul>
          <li>Party events and activities</li>
          <li>Policy discussions and voting</li>
          <li>Member-only resources</li>
          <li>Community engagement opportunities</li>
        </ul>
        <p>Thank you for your commitment to our cause!</p>
        <hr>
        <p><strong>Kenya Great Party Team</strong></p>
      </div>
    `
  }),

  newsletter: (name, content) => ({
    subject: 'KGP Newsletter - Latest Updates',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ADD8E6;">KGP Newsletter</h2>
        <p>Dear ${name},</p>
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0;">
          ${content}
        </div>
        <p>Stay connected with us for more updates!</p>
        <hr>
        <p><strong>Kenya Great Party Team</strong></p>
      </div>
    `
  }),

  eventReminder: (name, eventTitle, eventDate, eventLocation) => ({
    subject: `Reminder: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ADD8E6;">Event Reminder</h2>
        <p>Dear ${name},</p>
        <p>This is a friendly reminder about the upcoming KGP event:</p>
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #ADD8E6;">
          <h3>${eventTitle}</h3>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Location:</strong> ${eventLocation}</p>
        </div>
        <p>We look forward to seeing you there!</p>
        <hr>
        <p><strong>Kenya Great Party Team</strong></p>
      </div>
    `
  })
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  emailTemplates
};
