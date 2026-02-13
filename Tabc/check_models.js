const fs = require('fs');

const files = [
    'models/tiny_face_detector_model.bin',
    'models/face_landmark_68_tiny_model.bin',
    'models/face_recognition_model.bin'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        const buffer = fs.readFileSync(file);
        const header = buffer.subarray(0, 50).toString('utf8'); // Try as string
        const isHTML = header.trim().startsWith('<') || header.includes('<!DOCTYPE') || header.includes('<html');
        console.log(`File: ${file}`);
        console.log(`Size: ${buffer.length} bytes`);
        console.log(`Header (hex): ${buffer.subarray(0, 10).toString('hex')}`);
        console.log(`Header (text): ${header.replace(/\n/g, ' ')}`);
        console.log(`Is HTML? ${isHTML}`);
        console.log('---');
    } else {
        console.log(`File: ${file} NOT FOUND`);
    }
});
