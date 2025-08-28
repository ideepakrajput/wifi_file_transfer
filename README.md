# WiFi File Transfer

A simple, lightweight file transfer application that allows you to share files between devices on the same WiFi network.

## Features

-   **Unlimited File Uploads**: No restrictions on file size or number of files
-   **Image Thumbnails**: Automatic thumbnail generation for images
-   **File Type Icons**: Font Awesome icons for different file types
-   **Image Preview**: Full-screen image preview with navigation (left/right arrows)
-   **Multi-Select Delete**: Select multiple files for batch deletion
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
4. View image thumbnails and click to preview in full screen
5. Use left/right arrow keys or buttons to navigate between images
6. Select multiple files using checkboxes for batch operations
7. Share text snippets using the "Share Text" tab
8. Download or delete files as needed

## Configuration

The application uses `config.js` to manage settings:

-   **File Size Limits**: Set to `Infinity` (no limits)
-   **File Count Limits**: Set to `Infinity` (no limits)
-   **Upload Timeout**: 10 minutes for large files
-   **Payload Size**: 100MB for JSON/text data
-   **Thumbnail Size**: 150x150 pixels for images

## Technical Details

-   **Backend**: Node.js with Express
-   **File Upload**: Multer with unlimited file handling
-   **Image Processing**: Sharp for thumbnail generation
-   **Frontend**: HTML5 with Tailwind CSS and Font Awesome icons
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
-   **Thumbnail Issues**: Ensure sufficient disk space for thumbnail generation
