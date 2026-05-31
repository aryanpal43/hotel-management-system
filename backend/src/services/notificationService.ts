const nodemailer = require('nodemailer');

// Socket.IO emitter placeholder
let ioInstance = null;

const initSocketIO = (io) => {
  ioInstance = io;
  console.log('[Socket Service] Socket.IO instance attached successfully.');
};

// Send real-time notification to a specific hotel's staff/users
const sendInAppAlert = (hotelId, eventName, payload) => {
  if (ioInstance) {
    const roomName = hotelId ? `hotel_${hotelId.toString()}` : 'global_admin';
    ioInstance.to(roomName).emit(eventName, payload);
    console.log(`[Socket Notification] Emitted event '${eventName}' to room '${roomName}'`);
  } else {
    console.log(`[Socket Notification Mock] No Socket.IO active. Event: ${eventName}, Payload:`, payload);
  }
};

// Email Transporter Config
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.EMAIL_PORT || '2525'),
    auth: {
      user: process.env.EMAIL_USER || '',
      password: process.env.EMAIL_PASSWORD || '',
    },
  });
};

// Send Email Alert
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Hotel Cloud SaaS" <no-reply@hotelcloudsaas.com>',
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Sent: ${info.messageId} to ${to}`);
    return info;
  } catch (error) {
    console.error('[Email Service Error] Failed to send email:', error.message);
    console.log(`[Email Service Mock Output] TO: ${to}\nSUBJECT: ${subject}\nBODY:\n${text || html}`);
  }
};

// Send WhatsApp Alert
const sendWhatsApp = async ({ toMobile, message, hotelId }) => {
  try {
    console.log(`[WhatsApp Service] Sending message to ${toMobile}...`);
    
    // Log simulation details for development
    console.log(`[WhatsApp SMS Mock API Triggered]
    --------------------------------------------------
    API Endpoint: ${process.env.WHATSAPP_API_URL}
    Sender Number: ${toMobile}
    Message Content:
    "${message}"
    --------------------------------------------------`);
    
    return { success: true, messageId: `msg_${Date.now()}` };
  } catch (error) {
    console.error('[WhatsApp Service Error] Failed to send alert:', error.message);
  }
};

// Auto email handlers for credentials
const sendCredentialsEmail = async ({ name, email, password, portalUrl, role }) => {
  const subject = `Welcome to Hotel Cloud SaaS - Your Credentials`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #4f46e5;">Welcome, ${name}!</h2>
      <p>Your profile has been created with the role of <strong>${role}</strong>.</p>
      <p>Here are your secure access credentials to manage the portal:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Username / Email:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Temporary Password:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #e11d48; font-weight: bold;">${password}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Portal Access URL:</strong></td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="${portalUrl}" style="color: #4f46e5;">${portalUrl}</a></td>
        </tr>
      </table>
      <p style="font-size: 13px; color: #666;">Please change your password immediately upon your first login for safety.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">Hotel Cloud SaaS Enterprise Edition</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text: `Welcome ${name}! Your account as ${role} has been created. Username: ${email}, Password: ${password}, Link: ${portalUrl}`,
  });
};

module.exports = {
  initSocketIO,
  sendInAppAlert,
  sendEmail,
  sendWhatsApp,
  sendCredentialsEmail,
};
