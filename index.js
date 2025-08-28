const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const ip = require('ip');
const config = require('./config');

const app = express();
const PORT = config.port;

// Configure server for large file uploads
app.set('timeout', config.timeout);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, config.directories.uploads);
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Create backup directory if it doesn't exist
const backupDir = path.join(__dirname, config.directories.backup);
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Path to the texts JSON file
const textsFilePath = path.join(uploadDir, 'texts.json');
const backupTextsFilePath = path.join(backupDir, 'texts_backup.json');

// Create an empty texts file if it doesn't exist
if (!fs.existsSync(textsFilePath)) {
    fs.writeFileSync(textsFilePath, JSON.stringify([]));
}

// Configure storage with no file size limits
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

// Configure multer with no file size limits
const upload = multer({
    storage,
    limits: {
        fileSize: config.upload.maxFileSize,
        files: config.upload.maxFiles
    }
});

// Enable CORS and JSON body parsing with increased limits
app.use(cors());
app.use(express.json({ limit: config.upload.maxPayloadSize }));
app.use(express.urlencoded({ extended: true, limit: config.upload.maxPayloadSize }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
        message: 'File uploaded successfully',
        filename: req.file.originalname
    });
});

// Multiple file upload endpoint - no file limit
app.post('/upload-multiple', upload.array('files'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    res.json({
        message: `${req.files.length} files uploaded successfully`,
        files: req.files.map(file => file.originalname)
    });
});

// Get list of files
app.get('/files', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to list files' });
        }

        const fileDetails = files
            .filter(file => file !== 'texts.json') // Exclude the texts.json file
            .map(filename => {
                const filePath = path.join(uploadDir, filename);
                const stats = fs.statSync(filePath);
                return {
                    name: filename,
                    size: stats.size,
                    lastModified: stats.mtime
                };
            });

        res.json(fileDetails);
    });
});

// Delete file (now moves to backup)
app.delete('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    const backupFilePath = path.join(backupDir, `${filename}_${Date.now()}`);

    if (fs.existsSync(filePath)) {
        try {
            // Create a readable stream from the source file
            const readStream = fs.createReadStream(filePath);
            // Create a writable stream to the destination file
            const writeStream = fs.createWriteStream(backupFilePath);

            // Pipe the source to the destination
            readStream.pipe(writeStream);

            // When the copy is complete, delete the original
            writeStream.on('finish', () => {
                fs.unlink(filePath, err => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to delete original file after backup' });
                    }
                    res.json({
                        message: 'File moved to backup successfully',
                        backupLocation: backupFilePath
                    });
                });
            });

            // Handle errors
            writeStream.on('error', err => {
                res.status(500).json({ error: 'Failed to backup file: ' + err.message });
            });
        } catch (err) {
            res.status(500).json({ error: 'Failed to move file to backup: ' + err.message });
        }
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Text handling routes
// Get all saved texts
app.get('/texts', (req, res) => {
    try {
        if (!fs.existsSync(textsFilePath)) {
            return res.json([]);
        }

        const textsData = fs.readFileSync(textsFilePath, 'utf-8');
        const texts = JSON.parse(textsData || '[]');
        res.json(texts);
    } catch (err) {
        console.error('Error reading texts file:', err);
        res.status(500).json({ error: 'Failed to read saved texts' });
    }
});

// Save a new text
app.post('/save-text', (req, res) => {
    try {
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Text content is required' });
        }

        // Read existing texts
        let texts = [];
        if (fs.existsSync(textsFilePath)) {
            const textsData = fs.readFileSync(textsFilePath, 'utf-8');
            texts = JSON.parse(textsData || '[]');
        }

        // Add new text with timestamp
        texts.push({
            content: content,
            timestamp: new Date().toISOString()
        });

        // Save back to file
        fs.writeFileSync(textsFilePath, JSON.stringify(texts, null, 2));

        res.json({ message: 'Text saved successfully' });
    } catch (err) {
        console.error('Error saving text:', err);
        res.status(500).json({ error: 'Failed to save text' });
    }
});

// Delete a saved text (now backs up before deletion)
app.delete('/texts/:index', (req, res) => {
    try {
        const index = parseInt(req.params.index);

        if (!fs.existsSync(textsFilePath)) {
            return res.status(404).json({ error: 'No saved texts found' });
        }

        // Read existing texts
        const textsData = fs.readFileSync(textsFilePath, 'utf-8');
        const texts = JSON.parse(textsData || '[]');

        // Check if index is valid
        if (isNaN(index) || index < 0 || index >= texts.length) {
            return res.status(400).json({ error: 'Invalid text index' });
        }

        // Backup the text being deleted
        let backupTexts = [];
        if (fs.existsSync(backupTextsFilePath)) {
            const backupData = fs.readFileSync(backupTextsFilePath, 'utf-8');
            backupTexts = JSON.parse(backupData || '[]');
        }

        // Add the text to backup with deletion timestamp
        const textToBackup = {
            ...texts[index],
            deletedAt: new Date().toISOString()
        };
        backupTexts.push(textToBackup);

        // Save to backup file
        fs.writeFileSync(backupTextsFilePath, JSON.stringify(backupTexts, null, 2));

        // Remove the text at the specified index
        texts.splice(index, 1);

        // Save back to file
        fs.writeFileSync(textsFilePath, JSON.stringify(texts, null, 2));

        res.json({
            message: 'Text backed up and deleted successfully',
            backedUpText: textToBackup
        });
    } catch (err) {
        console.error('Error deleting text:', err);
        res.status(500).json({ error: 'Failed to delete text' });
    }
});

// Start server
app.listen(PORT, () => {
    const ipAddress = ip.address();
    console.log(`Server running at http://${ipAddress}:${PORT}`);
    console.log(`Share this address with devices on the same WiFi network`);
    console.log(`No file size or count limits configured`);
});

// Error handling for large file uploads
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'File too large' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(413).json({ error: 'Too many files' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Unexpected file field' });
        }
    }
    next(err);
});
