const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    let transporter;

    // Use SMTP options if available in env, otherwise fallback to standard console log + nodemailer ethereal testing
    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Ethereal fake email account for testing if no credentials are provided
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'lifedrop.test@ethereal.email',
          pass: 'lifedroptestpass123',
        },
      });
    }

    const message = {
      from: `${process.env.FROM_NAME || 'LifeDrop Network'} <${process.env.FROM_EMAIL || 'no-reply@lifedrop.org'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message}</p>`,
    };

    const info = await transporter.sendMail(message);

    console.log(`Email Sent: ${info.messageId}`);
    // If using ethereal, output the preview url
    if (!process.env.SMTP_HOST) {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return true;
  } catch (error) {
    console.error('Email sending error:', error.message);
    // Return true anyway so the application doesn't crash on connection limits
    return false;
  }
};

module.exports = sendEmail;
