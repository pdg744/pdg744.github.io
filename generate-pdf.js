const puppeteer = require('puppeteer');

async function generatePDF() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Load the whitepaper page
    await page.goto('http://localhost:8000/whitepaper.html', {
        waitUntil: 'networkidle0'
    });
    
    // Add print-specific styles
    await page.addStyleTag({
        content: `
            .download-pdf { display: none !important; }
            .highlight { background: none !important; border: 1px solid #ccc !important; }
            * { color: black !important; }
            body { background: white !important; }
            
            /* Three-column layout for impact and why-it-matters sections */
            .whitepaper-section:nth-of-type(6),
            .whitepaper-section:nth-of-type(8) {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 1em !important;
                margin-bottom: 1em !important;
            }
            
            .whitepaper-section:nth-of-type(6) h2,
            .whitepaper-section:nth-of-type(8) h2 {
                flex: 0 0 100% !important;
                margin-bottom: 0.5em !important;
                font-size: 1.2em !important;
            }
            
            .whitepaper-section:nth-of-type(6) h3,
            .whitepaper-section:nth-of-type(8) h3 {
                flex: 0 0 100% !important;
                margin: 0.3em 0 !important;
                font-size: 1em !important;
                font-weight: bold !important;
            }
            
            .whitepaper-section:nth-of-type(6) ul,
            .whitepaper-section:nth-of-type(8) ul {
                flex: 1 1 30% !important;
                min-width: 0 !important;
                margin: 0 !important;
                padding-left: 1.2em !important;
            }
            
            .whitepaper-section:nth-of-type(6) li,
            .whitepaper-section:nth-of-type(8) li {
                margin-bottom: 0.3em !important;
                font-size: 0.9em !important;
                line-height: 1.3 !important;
            }
        `
    });
    
    // Generate PDF
    await page.pdf({
        path: 'whitepaper.pdf',
        format: 'A4',
        printBackground: true,
        margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
        }
    });
    
    await browser.close();
}

generatePDF().catch(console.error); 