const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const ip = require('ip');
const config = require('./config');
const sharp = require('sharp');

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

// Create thumbnails directory if it doesn't exist
const thumbnailsDir = path.join(__dirname, 'thumbnails');
if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
}

// Path to the texts JSON file
const textsFilePath = path.join(uploadDir, 'texts.json');
const backupTextsFilePath = path.join(backupDir, 'texts_backup.json');

// Create an empty texts file if it doesn't exist
if (!fs.existsSync(textsFilePath)) {
    fs.writeFileSync(textsFilePath, JSON.stringify([]));
}

// Helper function to check if file is an image
function isImageFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'].includes(ext);
}

// Helper function to generate thumbnail
async function generateThumbnail(filePath, filename) {
    try {
        const thumbnailPath = path.join(thumbnailsDir, `thumb_${filename}`);

        // Check if thumbnail already exists
        if (fs.existsSync(thumbnailPath)) {
            return thumbnailPath;
        }

        // Generate thumbnail
        await sharp(filePath)
            .resize(150, 150, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

        return thumbnailPath;
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        return null;
    }
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
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// File upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate thumbnail if it's an image
    let thumbnailPath = null;
    if (isImageFile(req.file.originalname)) {
        thumbnailPath = await generateThumbnail(req.file.path, req.file.originalname);
    }

    res.json({
        message: 'File uploaded successfully',
        filename: req.file.originalname,
        thumbnail: thumbnailPath ? `/thumbnails/thumb_${req.file.originalname}` : null
    });
});

// Multiple file upload endpoint - no file limit
app.post('/upload-multiple', upload.array('files'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadResults = [];
    for (const file of req.files) {
        let thumbnailPath = null;
        if (isImageFile(file.originalname)) {
            thumbnailPath = await generateThumbnail(file.path, file.originalname);
        }

        uploadResults.push({
            filename: file.originalname,
            thumbnail: thumbnailPath ? `/thumbnails/thumb_${file.originalname}` : null
        });
    }

    res.json({
        message: `${req.files.length} files uploaded successfully`,
        files: uploadResults
    });
});

// Get list of files
app.get('/files', async (req, res) => {
    fs.readdir(uploadDir, async (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to list files' });
        }

        const fileDetails = [];
        for (const filename of files) {
            if (filename === 'texts.json') continue; // Exclude the texts.json file

            const filePath = path.join(uploadDir, filename);
            const stats = fs.statSync(filePath);

            const fileInfo = {
                name: filename,
                size: stats.size,
                lastModified: stats.mtime,
                isImage: isImageFile(filename),
                thumbnail: null
            };

            // Generate thumbnail if it's an image
            if (fileInfo.isImage) {
                const thumbnailPath = await generateThumbnail(filePath, filename);
                if (thumbnailPath) {
                    fileInfo.thumbnail = `/thumbnails/thumb_${filename}`;
                }
            }

            fileDetails.push(fileInfo);
        }

        res.json(fileDetails);
    });
});

// Delete multiple files
app.delete('/files', (req, res) => {
    const { filenames } = req.body;

    if (!Array.isArray(filenames) || filenames.length === 0) {
        return res.status(400).json({ error: 'No filenames provided' });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    filenames.forEach(filename => {
        const filePath = path.join(uploadDir, filename);
        const backupFilePath = path.join(backupDir, `${filename}_${Date.now()}`);
        const thumbnailPath = path.join(thumbnailsDir, `thumb_${filename}`);

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
                            results.push({ filename, success: false, error: 'Failed to delete original file after backup' });
                            errorCount++;
                        } else {
                            results.push({ filename, success: true, backupLocation: backupFilePath });
                            successCount++;
                        }

                        // Delete thumbnail if it exists
                        if (fs.existsSync(thumbnailPath)) {
                            fs.unlink(thumbnailPath, () => { });
                        }

                        // Check if all operations are complete
                        if (results.length === filenames.length) {
                            res.json({
                                message: `${successCount} files moved to backup successfully, ${errorCount} failed`,
                                results: results
                            });
                        }
                    });
                });

                // Handle errors
                writeStream.on('error', err => {
                    results.push({ filename, success: false, error: 'Failed to backup file: ' + err.message });
                    errorCount++;

                    if (results.length === filenames.length) {
                        res.json({
                            message: `${successCount} files moved to backup successfully, ${errorCount} failed`,
                            results: results
                        });
                    }
                });
            } catch (err) {
                results.push({ filename, success: false, error: 'Failed to move file to backup: ' + err.message });
                errorCount++;

                if (results.length === filenames.length) {
                    res.json({
                        message: `${successCount} files moved to backup successfully, ${errorCount} failed`,
                        results: results
                    });
                }
            }
        } else {
            results.push({ filename, success: false, error: 'File not found' });
            errorCount++;

            if (results.length === filenames.length) {
                res.json({
                    message: `${successCount} files moved to backup successfully, ${errorCount} failed`,
                    results: results
                });
            }
        }
    });
});

// Delete file (now moves to backup) - keeping for single file deletion
app.delete('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    const backupFilePath = path.join(backupDir, `${filename}_${Date.now()}`);
    const thumbnailPath = path.join(thumbnailsDir, `thumb_${filename}`);

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

                    // Delete thumbnail if it exists
                    if (fs.existsSync(thumbnailPath)) {
                        fs.unlink(thumbnailPath, () => { });
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
