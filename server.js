const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');
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

async function sendReportByEmail(reportData, userEmail) {
  try {
    const pdfBuffer = await generatePDF(reportData);
    const attachments = [{
      filename: 'GMB-Risk-Report.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    }];

    const result = await sendEmail({
      subject: 'Your GMB Risk Assessment Report',
      text: `Dear User,\n\nPlease find attached your GMB Suspension Risk Report.\n\nWe will contact you soon to schedule your consultation.\n\nFor immediate help, contact our support team at support@gmbriskchecker.com\n\nBest regards,\nGMB Risk Checker Team`,
      attachments,
      to: userEmail,
    });

    return result;
  } catch (error) {
    console.error('Error sending report email:', error);
    return { success: false, error };
  }
}

async function sendLoginNotification(userData) {
  try {
    const content = `🔐 User Login Notification

A user has logged into the GMB Risk Checker application.

User Details:
- Name: ${userData.displayName || 'N/A'}
- Email: ${userData.email}
- User ID: ${userData.uid}
- Login Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
- Provider: Google

Best regards,
GMB Risk Checker System`;

    const result = await sendEmail({
      subject: '🔐 New User Login - GMB Risk Checker',
      text: content,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
    });

    return result;
  } catch (error) {
    console.error('Error sending login notification:', error);
    return { success: false, error };
  }
}

async function generatePDF(reportData) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Create HTML from reportData with inline styles for PDF
  const riskColor = reportData.riskLevel.color;
  const riskClass = reportData.riskLevel.level.toLowerCase().replace(/\s+/g, '-');
  const riskFactorsHtml = reportData.riskFactors.map(factor => `<li style="margin-bottom: 10px; color: #721c24;">${factor}</li>`).join('');
  const recommendationsHtml = reportData.recommendations.map(rec => `<li style="margin-bottom: 10px;">${rec}</li>`).join('');
  const businessTypeHtml = reportData.businessType ? `<p style="font-size: 16px; margin: 10px 0;"><strong>Business Type:</strong> ${reportData.businessType}</p>` : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          h1 { text-align: center; color: #333; }
          .risk-level { text-align: center; padding: 20px; border-radius: 10px; margin: 20px 0; background-color: ${riskColor}20; border: 2px solid ${riskColor}; }
          .risk-title { font-size: 24px; font-weight: bold; color: ${riskColor}; margin-bottom: 10px; }
          .risk-score { font-size: 48px; font-weight: bold; color: ${riskColor}; margin: 10px 0; }
          h3 { color: #333; margin-top: 20px; }
          ul { list-style-type: disc; padding-left: 20px; }
          li { margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>GMB Suspension Risk Report</h1>
        <div class="risk-level">
          <div class="risk-title">${reportData.riskLevel.level} Risk</div>
          <div class="risk-score">${reportData.riskScore}/100</div>
        </div>
        ${businessTypeHtml}
        ${reportData.riskFactors.length > 0 ? `<h3>Identified Risk Factors</h3><ul>${riskFactorsHtml}</ul>` : ''}
        ${reportData.recommendations.length > 0 ? `<h3>Recommendations to Reduce Risk</h3><ul>${recommendationsHtml}</ul>` : ''}
      </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ 
    format: 'A4', 
    printBackground: true,
    margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
  });

  await browser.close();
  return pdfBuffer;
}

const API_KEY = process.env.API_KEY;

const submitForm = async (req, res) => {
  const { body, file } = req;

  console.log('Form submission received:', body);

  if (body.apiKey !== API_KEY) {
    console.log('Invalid API key');
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Extract user email for sending the response
  const userEmail = body.email;
  delete body.apiKey;

  const formContent = Object.entries(body)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const content = `Request Expert Consultation
Our GMB specialists will review your assessment and provide personalized recommendations.

User Email: ${userEmail}

Form Data:
${formContent}`;

  console.log('Preparing to send email with content length:', content.length);

  const attachments = file
    ? [{
        filename: file.originalname,
        content: file.buffer,
      }]
    : [];

  // Send only client data to admin
  const adminResult = await sendEmail({
    subject: '📨 New GBP Form Submission - Client Data',
    text: content,
    attachments,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
  });

  // Send PDF report to client
  const mockReportData = {
    riskLevel: { level: 'Medium', color: '#ffc107' },
    riskScore: 67,
    businessType: body.businessName,
    riskFactors: ['Based on your consultation request', 'Detailed analysis will be provided during call'],
    recommendations: ['We will contact you soon to schedule your consultation', 'Personalized action plan will be sent after the call']
  };

  const pdfResult = await sendReportByEmail(mockReportData, userEmail);

  if (adminResult.success && pdfResult.success) {
    console.log('Admin email and client PDF sent successfully');
    res.json({ message: 'Form submitted successfully. Client data received and report sent to your email.' });
  } else {
    console.log('Failed to send admin email or client PDF:', adminResult.error || pdfResult.error);
    res.status(500).json({ error: 'Failed to send client data or report' });
  }
};

module.exports = {
  sendEmail,
  submitForm,
  generatePDF,
  sendReportByEmail,
  sendLoginNotification,
};
