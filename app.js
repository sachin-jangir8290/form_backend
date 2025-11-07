const express = require('express');
const multer = require('multer');
const cors = require('cors');
const {
  submitForm,
  sendEmail,
  generatePDF,
  sendLoginNotification
} = require('./server');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const upload = multer();

// 📨 Form submission
app.post('/api/form', upload.single('file'), submitForm);

// 👁️ Form viewed
app.post('/api/form-viewed', (req, res) => {
  const { apiKey, time, userAgent, referrer, page } = req.body;

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const content = `👁️ Form Viewed

Time: ${time}
Page: ${page}
User Agent: ${userAgent}
Referrer: ${referrer}`;

  sendEmail({
    subject: '👁️ GBP Form Page Viewed - User Activity',
    text: content,
  }).then(result => {
    if (result.success) res.json({ message: 'Tracked successfully' });
    else res.status(500).json({ error: 'Failed to send notification' });
  });
});

// 🚨 Button clicked
app.post('/api/button-click', (req, res) => {
  const { apiKey, timestamp, userAgent, referrer, action } = req.body;

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const content = `🚨 Button Clicked

Time: ${timestamp}
Action: ${action}
User Agent: ${userAgent}
Referrer: ${referrer}`;

  sendEmail({
    subject: '🚨 GBP Button Clicked - User Activity',
    text: content,
  }).then(result => {
    if (result.success) res.json({ message: 'Tracked successfully' });
    else res.status(500).json({ error: 'Failed to send notification' });
  });
});

// ❌ Form closed
app.post('/api/form-close', (req, res) => {
  const { apiKey, timestamp, userAgent, referrer, action } = req.body;

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const content = `❌ Form Closed

Time: ${timestamp}
Action: ${action}
User Agent: ${userAgent}
Referrer: ${referrer}`;

  sendEmail({
    subject: '❌ GBP Form Closed - User Activity',
    text: content,
  }).then(result => {
    if (result.success) res.json({ message: 'Tracked successfully' });
    else res.status(500).json({ error: 'Failed to send notification' });
  });
});

// 🧾 PDF Download (manual)
app.post('/api/generate-pdf', async (req, res) => {
  const { apiKey, reportData } = req.body;

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  try {
    const pdfBuffer = await generatePDF(reportData);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="GMB-Risk-Report.pdf"',
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// 🔐 User Login Notification
app.post('/api/user-login', async (req, res) => {
  const { apiKey, userData } = req.body;

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  if (!userData || !userData.email) {
    return res.status(400).json({ error: 'User data with email is required' });
  }

  try {
    const result = await sendLoginNotification(userData);
    if (result.success) {
      res.json({ message: 'Login notification sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send login notification' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send login notification' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
