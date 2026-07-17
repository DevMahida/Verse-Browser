import fs from 'fs';

async function testExport() {
  const content = '# Hello World\nThis is a **test** document generated via *Puppeteer* and `html-to-docx`.';
  
  try {
    // Test PDF
    const pdfResponse = await fetch('http://localhost:3000/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, format: 'pdf' })
    });
    
    if (pdfResponse.ok) {
      const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
      fs.writeFileSync('test_output.pdf', pdfBuffer);
      console.log('PDF generation successful. Saved to test_output.pdf');
    } else {
      console.error('PDF generation failed:', await pdfResponse.text());
    }

    // Test DOCX
    const docxResponse = await fetch('http://localhost:3000/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, format: 'docx' })
    });
    
    if (docxResponse.ok) {
      const docxBuffer = Buffer.from(await docxResponse.arrayBuffer());
      fs.writeFileSync('test_output.docx', docxBuffer);
      console.log('DOCX generation successful. Saved to test_output.docx');
    } else {
      console.error('DOCX generation failed:', await docxResponse.text());
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testExport();
