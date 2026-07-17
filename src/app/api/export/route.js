import { NextResponse } from 'next/server';
import { marked } from 'marked';
import HTMLtoDOCX from 'html-to-docx';
import puppeteer from 'puppeteer';

export async function POST(request) {
  try {
    const { content, format, userPrompt } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    if (!['pdf', 'docx'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Must be "pdf" or "docx"' }, { status: 400 });
    }

    // Process content and filename
    let filename = `export.${format}`;
    let finalContent = content;

    if (userPrompt) {
      const sanitizedPrompt = userPrompt.slice(0, 30).replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').toLowerCase();
      filename = `${sanitizedPrompt || 'export'}.${format}`;
      finalContent = `**Instruction:** ${userPrompt}\n\n---\n\n${content}`;
    }

    // Convert markdown to HTML
    const htmlContent = marked.parse(finalContent);
    
    // Add some basic styling for better looking PDF/DOCX
    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }
            h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
            p { margin-bottom: 1em; }
            code { font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace; background-color: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px; font-size: 85%; }
            pre { background-color: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; }
            pre code { background-color: transparent; padding: 0; }
            blockquote { margin: 0; padding: 0 1em; color: #6a737d; border-left: 0.25em solid #dfe2e5; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
            th, td { padding: 6px 13px; border: 1px solid #dfe2e5; }
            th { font-weight: 600; background-color: #f6f8fa; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    if (format === 'pdf') {
      // Launch Puppeteer to generate PDF
      const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(styledHtml, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' }
      });
      
      await browser.close();

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    } else if (format === 'docx') {
      // Generate DOCX
      const docxBuffer = await HTMLtoDOCX(styledHtml, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
      });

      return new NextResponse(docxBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }
  } catch (error) {
    console.error('Error generating document:', error);
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 });
  }
}
