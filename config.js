// Configuration file for WiFi File Transfer
module.exports = {
    // Server configuration
    port: process.env.PORT || 6171,
    timeout: 600000, // 10 minutes in milliseconds

    // File upload configuration
    upload: {
        maxFileSize: Infinity,        // No file size limit
        maxFiles: Infinity,           // No file count limit
        maxPayloadSize: '100mb',      // Express body parser limit
        uploadTimeout: 600000         // 10 minutes upload timeout
    },

    // Directories
    directories: {
        uploads: 'uploads',
        backup: 'backup'
    }
};
