const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const results = [];

    for (let i = 1; i <= 304; i++) {
        const url = `https://www.1mg.com/ayurveda/${i}`;
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded' });

            await page.waitForSelector('h1', { timeout: 3000 });

            const herbName = await page.$eval('h1', el => el.innerText.trim());
            results.push({ id: i, name: herbName });

            console.log(`✅ [${i}] ${herbName}`);
        } catch (err) {
            console.warn(`❌ [${i}] Skipped - ${err.message}`);
        }
    }

    // Write to JSON file
    fs.writeFileSync('herbs.json', JSON.stringify(results, null, 2));
    console.log('\n📝 Saved to herbs.json');

    await browser.close();
})();
