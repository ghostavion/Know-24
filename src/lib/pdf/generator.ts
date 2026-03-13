/**
 * PDF Generator -- renders HTML templates to formatted, paginated PDFs
 * Uses Puppeteer for pixel-perfect rendering
 */

export interface PdfGenerationOptions {
  title: string;
  subtitle?: string;
  author?: string;
  content: {
    chapterTitle: string;
    chapterContent: string;
  }[];
  coverImageUrl?: string;
  brandColor?: string;
  format?: "ebook" | "cheat_sheet" | "workbook";
}

export async function generateProductPdf(options: PdfGenerationOptions): Promise<Buffer> {
  // Dynamic import to avoid loading Puppeteer at module level
  const puppeteer = await import("puppeteer");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    const brandColor = options.brandColor ?? "#0891b2";

    const html = buildEbookHtml(options, brandColor);
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "60px", bottom: "60px", left: "50px", right: "50px" },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:9px;color:#999;width:100%;text-align:center;padding-top:10px;">${options.title}</div>`,
      footerTemplate: `<div style="font-size:9px;color:#999;width:100%;text-align:center;padding-bottom:10px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function buildEbookHtml(options: PdfGenerationOptions, brandColor: string): string {
  const chapters = options.content
    .map(
      (ch, i) => `
    <div class="chapter" style="page-break-before: always;">
      <h2 style="color: ${brandColor}; font-size: 28px; margin-bottom: 8px; border-bottom: 2px solid ${brandColor}; padding-bottom: 12px;">
        Chapter ${i + 1}
      </h2>
      <h3 style="font-size: 22px; color: #1a1a1a; margin-bottom: 24px;">${ch.chapterTitle}</h3>
      <div style="font-size: 14px; line-height: 1.8; color: #333;">
        ${ch.chapterContent
          .split("\n")
          .map((p) => (p.trim() ? `<p style="margin-bottom: 16px;">${p}</p>` : ""))
          .join("")}
      </div>
    </div>
  `
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; color: #1a1a1a; }
    .cover {
      height: 100vh; display: flex; flex-direction: column;
      justify-content: center; align-items: center; text-align: center;
      background: linear-gradient(135deg, ${brandColor}15, ${brandColor}05);
      page-break-after: always;
    }
    .cover h1 { font-size: 42px; font-weight: 700; color: #1a1a1a; max-width: 600px; line-height: 1.2; }
    .cover .subtitle { font-size: 18px; color: #666; margin-top: 16px; }
    .cover .author { font-size: 14px; color: ${brandColor}; margin-top: 32px; text-transform: uppercase; letter-spacing: 2px; }
    .toc { page-break-after: always; padding: 60px 40px; }
    .toc h2 { color: ${brandColor}; font-size: 28px; margin-bottom: 32px; }
    .toc-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; font-size: 16px; }
    .toc-item span:first-child { color: #333; }
    .toc-item span:last-child { color: #999; }
  </style>
</head>
<body>
  <div class="cover">
    ${
      options.coverImageUrl
        ? `<img src="${options.coverImageUrl}" style="max-width: 300px; margin-bottom: 40px; border-radius: 12px;" />`
        : `<div style="width: 120px; height: 120px; border-radius: 24px; background: ${brandColor}; margin-bottom: 40px;"></div>`
    }
    <h1>${options.title}</h1>
    ${options.subtitle ? `<p class="subtitle">${options.subtitle}</p>` : ""}
    ${options.author ? `<p class="author">By ${options.author}</p>` : ""}
  </div>

  <div class="toc">
    <h2>Table of Contents</h2>
    ${options.content
      .map(
        (ch, i) => `
      <div class="toc-item">
        <span>Chapter ${i + 1}: ${ch.chapterTitle}</span>
      </div>
    `
      )
      .join("")}
  </div>

  ${chapters}
</body>
</html>`;
}
