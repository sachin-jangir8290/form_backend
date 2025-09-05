const nodemailer = require('nodemailer');
require('dotenv').config();

// Create the transporter using SMTP or any other service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // e.g. your_email@gmail.com
    pass: process.env.EMAIL_PASS, // app password, not Gmail password
  },
});

async function sendEmail({ subject, text, attachments, to }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to || process.env.EMAIL_TO || process.env.EMAIL_USER,
      subject,
      text,
      attachments,
    });

    console.log('Email sent:', info.response);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

const API_KEY = process.env.API_KEY;

const submitForm = async (req, res) => {
  const { body, file } = req;

  if (body.apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Extract user email for sending the response
  const userEmail = body.email;
  delete body.apiKey;

  const content = `User Email: ${userEmail}\n\nForm Data:\n` + Object.entries(body)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const attachments = file
    ? [{
        filename: file.originalname,
        content: file.buffer,
      }]
    : [];

  // Send email to the user's email address
  const userResult = await sendEmail({
    subject: '📨 GBP Suspension Checker Report',
    text: content,
    attachments,
    to: userEmail, // Use user's email as recipient
  });

  // Also send a copy to admin for tracking
  const adminContent = `New Form Submission from: ${userEmail}\n\n${content}`;
  const adminResult = await sendEmail({
    subject: '📨 New GBP Form Submission - Admin Copy',
    text: adminContent,
    attachments,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER, // Send to admin
  });

  if (userResult.success && adminResult.success) {
    res.json({ message: 'Form submitted and emails sent successfully' });
  } else {
    res.status(500).json({ error: 'Failed to send one or more emails' });
  }
};

module.exports = {
  sendEmail,
  submitForm,
};
