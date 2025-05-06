const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const ip = require('ip');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Path to the texts JSON file
const textsFilePath = path.join(uploadDir, 'texts.json');

// Create an empty texts file if it doesn't exist
if (!fs.existsSync(textsFilePath)) {
    fs.writeFileSync(textsFilePath, JSON.stringify([]));
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Multiple file upload endpoint
app.post('/upload-multiple', upload.array('files', 10), (req, res) => {
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

// Delete file
app.delete('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, err => {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete file' });
            }
            res.json({ message: 'File deleted successfully' });
        });
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

// Delete a saved text
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

        // Remove the text at the specified index
        texts.splice(index, 1);

        // Save back to file
        fs.writeFileSync(textsFilePath, JSON.stringify(texts, null, 2));

        res.json({ message: 'Text deleted successfully' });
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
});
