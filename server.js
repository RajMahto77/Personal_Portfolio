require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Enquiry = require('./models/Enquiry');

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com', port: Number(process.env.SMTP_PORT) || 465,
  secure: (Number(process.env.SMTP_PORT) || 465) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
const oneLine = (t) => t.replace(/[\r\n]+/g, ' ');

const app = express();
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"], styleSrc: ["'self'", 'https://fonts.googleapis.com'],
  fontSrc: ['https://fonts.gstatic.com'], scriptSrc: ["'self'"], imgSrc: ["'self'", 'data:'] } } }));
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many messages. Please try again later.' } });

app.post('/api/contact', limiter, async (req, res) => {
  const { name, email, subject = '', message, website } = req.body || {};
  if (website) return res.json({ ok: true });            // honeypot: bots fill this hidden field
  const s = (v) => typeof v === 'string' ? v.trim() : '';
  const d = { name: s(name), email: s(email).toLowerCase(), subject: s(subject), message: s(message) };
  if (d.name.length < 2 || d.name.length > 80) return res.status(400).json({ error: 'Please enter your name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || d.email.length > 120) return res.status(400).json({ error: 'Please enter a valid email.' });
  if (d.subject.length > 120) return res.status(400).json({ error: 'Subject is too long.' });
  if (d.message.length < 10 || d.message.length > 1500) return res.status(400).json({ error: 'Message must be 10–1500 characters.' });
  let saved;
  try { saved = await Enquiry.create(d); }
  catch (e) { console.error(e); return res.status(500).json({ error: 'Could not save your message. Please try again.' }); }
  // Email the message to the portfolio owner. The enquiry is already saved, so nothing is lost if email fails.
  try {
    await mailer.sendMail({
      from: `"Portfolio Website" <${process.env.SMTP_USER}>`,
      to: process.env.NOTIFY_EMAIL || process.env.SMTP_USER,
      replyTo: `"${oneLine(d.name).replace(/"/g, '')}" <${d.email}>`,
      subject: 'New portfolio message' + (d.subject ? ': ' + oneLine(d.subject) : ' from ' + oneLine(d.name)),
      text: `Name: ${d.name}\nEmail: ${d.email}\nSubject: ${d.subject || '-'}\n\n${d.message}`,
    });
    await Enquiry.updateOne({ _id: saved._id }, { emailed: true });
  } catch (e) { console.error('Email notification failed:', e.message); }
  res.status(201).json({ ok: true });
});

const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(port, () => console.log('Portfolio running on http://localhost:' + port)))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
