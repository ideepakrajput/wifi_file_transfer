const nodemailer = require('nodemailer');

// SMTP Configuration
const smtpConfig = {
    host: 'mail.sheopals.in',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'care@sheopals.in',
        pass: 'Sp#$13452'
    },
    tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
    }
};

/**
 * Test email credentials by connecting to SMTP server
 */
async function testEmailCredentials() {
    try {
        const transporter = nodemailer.createTransport(smtpConfig);

        // Verify connection
        await transporter.verify();

        console.log('✅ SMTP connection successful!');
        console.log('✅ Credentials are correct!');
        return true;
    } catch (error) {
        console.error('❌ SMTP connection failed:', error.message);
        return false;
    }
}

/**
 * Send email with optional attachment
 * @param {Object} options - Email options
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body (optional)
 * @param {string|Array} options.attachments - File path(s) or attachment objects (optional)
 */
async function sendEmail(options = {}) {
    try {
        const transporter = nodemailer.createTransport(smtpConfig);

        // Default email options
        const mailOptions = {
            from: {
                name: 'Sheopals System',
                address: 'care@sheopals.in'
            },
            to: 'deepakrajput.sheopals@gmail.com',
            subject: options.subject || `Email from Sheopals System - ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
            text: options.text || 'This is a test email from Sheopals System.',
            html: options.html || options.text || 'This is a test email from Sheopals System.',
            attachments: options.attachments || []
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Sent at:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), 'IST');

        return {
            success: true,
            messageId: info.messageId,
            response: info.response
        };
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        if (error.response) {
            console.error('Full error details:', error.response);
        }
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send email with CSV attachment (similar to PHP function)
 * @param {string} csvFilePath - Path to CSV file to attach
 */
async function sendEmailWithCSV(csvFilePath) {
    const fs = require('fs');
    const path = require('path');

    try {
        // Check if file exists
        if (!fs.existsSync(csvFilePath)) {
            throw new Error(`CSV file not found: ${csvFilePath}`);
        }

        const istTime = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const result = await sendEmail({
            subject: `CSV Export - ${istTime} IST`,
            text: `Please find attached CSV file generated at ${istTime} IST.`,
            html: `<p>Please find attached CSV file generated at <strong>${istTime} IST</strong>.</p>`,
            attachments: [{
                filename: path.basename(csvFilePath),
                path: csvFilePath
            }]
        });

        return result;
    } catch (error) {
        console.error('Error sending email with CSV:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Main execution
async function main() {
    // Test credentials first
    console.log('Testing email credentials...\n');
    const credentialsValid = await testEmailCredentials();

    if (credentialsValid) {
        console.log('\n✅ Credentials are working! Sending test email...\n');

        // Send a test email
        const result = await sendEmail({
            subject: 'Test Email from Node.js',
            text: 'This is a test email sent from Node.js using the same SMTP credentials as the PHP script.',
            html: '<p>This is a <strong>test email</strong> sent from Node.js using the same SMTP credentials as the PHP script.</p>'
        });

        if (result.success) {
            console.log('\n✅ Test email sent successfully!');
        } else {
            console.log('\n❌ Failed to send test email.');
        }
    } else {
        console.log('\n❌ Credentials failed. Please check your email settings.');
        console.log('Common issues:');
        console.log('1. Wrong password');
        console.log('2. Wrong username');
        console.log('3. Email account doesn\'t exist');
        console.log('4. Account is locked or disabled');
        console.log('5. Need app-specific password');
    }
}

// Export functions for use in other modules
module.exports = {
    testEmailCredentials,
    sendEmail,
    sendEmailWithCSV
};

// Run main function if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

