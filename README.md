# WiFi File Transfer

A simple, lightweight file transfer application that allows you to share files between devices on the same WiFi network.

## Features

-   **Unlimited File Uploads**: No restrictions on file size or number of files
-   **Drag & Drop Interface**: Easy file upload with drag and drop support
-   **Text Sharing**: Share and save text snippets between devices
-   **QR Code Generation**: Quick access via QR code scanning
-   **File Management**: Download, delete, and manage uploaded files
-   **Backup System**: Automatic backup of deleted files and texts
-   **Cross-Platform**: Works on any device with a web browser

## Installation

1. Clone or download this repository
2. Install dependencies:
    ```bash
    npm install
    ```
3. Start the server:
    ```bash
    npm start
    ```

## Usage

1. Start the server - it will display the local IP address
2. Share the displayed address with other devices on the same WiFi network
3. Upload files by dragging and dropping or clicking the upload area
4. Share text snippets using the "Share Text" tab
5. Download or delete files as needed

## Configuration

The application uses `config.js` to manage settings:

-   **File Size Limits**: Set to `Infinity` (no limits)
-   **File Count Limits**: Set to `Infinity` (no limits)
-   **Upload Timeout**: 5 minutes for large files
-   **Payload Size**: 50MB for JSON/text data

## Technical Details

-   **Backend**: Node.js with Express
-   **File Upload**: Multer with unlimited file handling
-   **Frontend**: HTML5 with Tailwind CSS
-   **File Storage**: Local file system with automatic backup
-   **CORS**: Enabled for cross-device access

## Network Requirements

-   All devices must be on the same WiFi network
-   No internet connection required
-   Works with local network IP addresses

## Security Notes

-   This application is designed for trusted local networks
-   No authentication required
-   Files are stored locally on the server machine
-   Consider firewall settings if uploads fail

## Troubleshooting

-   **Upload Fails**: Check if devices are on the same network
-   **Large File Issues**: Ensure sufficient disk space and wait for timeout
-   **Port Conflicts**: Change the port in `config.js` if needed
