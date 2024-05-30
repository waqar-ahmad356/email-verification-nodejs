const express = require('express');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = new User({ email, password });
        await user.save();

        // Create a token
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Send verification email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const verificationUrl = `http://localhost:3000/auth/verify/${token}`;

        const mailOptions = {
            from: `"Your App" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Email Verification',
            text: `Please verify your email by clicking the following link: ${verificationUrl}`,
            html: `<a href="${verificationUrl}">Verify your email</a>`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).send('Registration successful! Please check your email to verify your account.');
    } catch (error) {
        res.status(500).send('Error registering user: ' + error.message);
    }
});

router.get('/verify/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ email: decoded.email });

        if (!user) {
            return res.status(400).send('Invalid verification link.');
        }

        user.verified = true;
        await user.save();

        res.redirect('http://yourfrontend.com/verification-success'); // Replace with your frontend URL
    } catch (error) {
        res.status(400).send('Invalid or expired token.');
    }
});

module.exports = router; // Ensure you're exporting the router object
