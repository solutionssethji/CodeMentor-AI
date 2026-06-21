import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string; documentId: string }> }
) {
  try {
    const p = await params;
    const courseId = p.courseId;
    const documentId = p.documentId;
    
    // We store the PDF under course_pdfs collection with ID: {courseId}_{documentId}
    const pdfDocRef = doc(db, "course_pdfs", `${courseId}_${documentId}`);
    const pdfSnap = await getDoc(pdfDocRef);

    if (!pdfSnap.exists()) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    const base64Data = pdfSnap.data().base64;
    
    if (!base64Data) {
      return NextResponse.json({ error: "Invalid PDF data" }, { status: 500 });
    }

    // Decode base64 to binary buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Return as a standard PDF file response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${documentId}.pdf"`,
      },
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error serving PDF:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
