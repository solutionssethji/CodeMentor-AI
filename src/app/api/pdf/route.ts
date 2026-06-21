import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic') || 'Course Document';
  
  try {
    const pdfDoc = await PDFDocument.create();
    
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    
    // Draw Header
    page.drawText("CodeMentor AI Platform", {
      x: 50,
      y: height - 60,
      size: 12,
      font: timesRomanFont,
      color: rgb(0.4, 0.4, 0.5),
    });

    // Draw Title
    page.drawText(topic, {
      x: 50,
      y: height - 100,
      size: 28,
      font: timesRomanBoldFont,
      color: rgb(0.1, 0.1, 0.4),
      maxWidth: width - 100,
    });

    // Draw Content
    const text = `This is the dynamically generated study guide for: \n"${topic}".\n\nBecause CodeMentor AI's catalog contains over 1,000 uniquely customized courses, it is impractical to store 12,000+ static PDF files in a database. \n\nInstead, this application architecture leverages on-the-fly programmatic generation using 'pdf-lib' to instantly stream a personalized, valid .pdf document directly into your browser's native PDF Viewer based on the exact module you clicked!\n\nIn a production release, this generation pipeline would compile markdown lessons, code snippets, and personalized curriculum into comprehensive 20-page interactive guides in real-time.`;
    
    page.drawText(text, {
      x: 50,
      y: height - 180,
      size: 14,
      font: timesRomanFont,
      color: rgb(0.2, 0.2, 0.2),
      maxWidth: width - 100,
      lineHeight: 24,
    });
    
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${topic.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      },
    });
  } catch {
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}
