const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { submitForm } = require('./server');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer();

// Route to handle form submission
app.post('/api/form', upload.single('file'), submitForm);

// Route to handle form viewed tracking
app.post('/api/form-viewed', (req, res) => {
  const { apiKey, time, userAgent, referrer, page } = req.body;

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Send notification email to admin
  const { sendEmail } = require('./server');

  const content = `👁️ Form Page Viewed!\n\nTime: ${time}\nUser Agent: ${userAgent}\nReferrer: ${referrer}\nPage: ${page}\n\nA user has viewed the GBP Suspension Checker page.`;

  sendEmail({
    subject: '👁️ GBP Form Page Viewed - User Activity',
    text: content,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
  }).then(result => {
    if (result.success) {
      res.json({ message: 'Form viewed tracked successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send notification' });
    }
  }).catch(err => {
    console.error('Form viewed tracking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

// Route to handle button click tracking
app.post('/api/button-click', (req, res) => {
  const { apiKey, timestamp, userAgent, referrer, action } = req.body;

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Send notification email to admin
  const { sendEmail } = require('./server');

  const content = `🚨 Button Click Alert!\n\nTime: ${timestamp}\nUser Agent: ${userAgent}\nReferrer: ${referrer}\nAction: ${action}\n\nA user has clicked the button to open the GBP Suspension Checker form.`;

  sendEmail({
    subject: '🚨 GBP Button Click - User Activity',
    text: content,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
  }).then(result => {
    if (result.success) {
      res.json({ message: 'Button click tracked successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send notification' });
    }
  }).catch(err => {
    console.error('Button click tracking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

// Route to handle form close tracking
app.post('/api/form-close', (req, res) => {
  const { apiKey, timestamp, userAgent, referrer, action } = req.body;

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Send notification email to admin
  const { sendEmail } = require('./server');

  const content = `🚨 Form Closed Alert!\n\nTime: ${timestamp}\nUser Agent: ${userAgent}\nReferrer: ${referrer}\nAction: ${action}\n\nA user has closed the GBP Suspension Checker form without submitting.`;

  sendEmail({
    subject: '🚨 GBP Form Closed - User Activity',
    text: content,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
  }).then(result => {
    if (result.success) {
      res.json({ message: 'Form close tracked successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send notification' });
    }
  }).catch(err => {
    console.error('Form close tracking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

// Route to handle form open tracking
app.post('/api/form-open', (req, res) => {
  const { apiKey, timestamp, userAgent, referrer } = req.body;

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Send notification email to admin
  const { sendEmail } = require('./server');

  const content = `🚨 Form Opened Alert!\n\nTime: ${timestamp}\nUser Agent: ${userAgent}\nReferrer: ${referrer}\n\nA user has opened the GBP Suspension Checker form.`;

  sendEmail({
    subject: '🚨 GBP Form Opened - User Activity',
    text: content,
    to: process.env.EMAIL_TO || process.env.EMAIL_USER,
  }).then(result => {
    if (result.success) {
      res.json({ message: 'Form open tracked successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send notification' });
    }
  }).catch(err => {
    console.error('Form open tracking error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});