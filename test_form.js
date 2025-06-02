const puppeteer = require('puppeteer');

const getRandomName = () => {
    const names = ['Rohit', 'Ayesha', 'Deepu', 'Nikhil', 'Sneha'];
    return names[Math.floor(Math.random() * names.length)];
};

const getRandomMessage = () => {
    const messages = [
        'Need help with a landing page.',
        'Looking to build a SaaS product.',
        'I want to collaborate on an AI project.',
        `Let's build an e-commerce app!`,
        'Looking for a React + Node expert.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
};

(async () => {
    const browser = await puppeteer.launch({ headless: true }); // visible browser
    const page = await browser.newPage();

    // Set up alert handler before navigating
    page.on('dialog', async dialog => {
        console.log(`Alert detected: ${dialog.message()}`);
        await dialog.accept(); // Accept the alert
    });

    await page.goto('https://ideepakrajput.tech', { waitUntil: 'networkidle0' });

    for (let i = 0; i < 5; i++) {
        // Fill form
        await page.type('#name', getRandomName());
        await page.type('#email', `test${i}@example.com`);
        await page.type('#phone', `99900000${i}`);
        await page.type('#message', getRandomMessage());

        // Click submit
        await page.click('#submitBtn');

        console.log(`✅ Form submitted (${i + 1}/5)`);

        // Optional: Refresh for clean form
        await page.reload({ waitUntil: 'networkidle0' });
    }

    await browser.close();
})();
