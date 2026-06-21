import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export const downloadPDF = async (courseName: string, userName: string, dateStr: string) => {
  // 1. Create a hidden container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  document.body.appendChild(container);

  // 2. Build the visual certificate structure using standard inline CSS for precise rendering
  // We use inline styles rather than Tailwind classes because html2canvas handles raw inline styles better
  const certificateHTML = `
    <div id="certificate-node" style="width: 1122px; height: 793px; background-color: #020617; padding: 0; box-sizing: border-box; font-family: 'Inter', 'Segoe UI', sans-serif; position: relative; overflow: hidden; text-align: center; color: #f8fafc;">
      
      <!-- Tech Grid Background -->
      <svg width="1122" height="793" style="position: absolute; top: 0; left: 0; z-index: 1; opacity: 0.15; pointer-events: none;" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6366f1" stroke-width="1" />
          </pattern>
        </defs>
        <rect width="1122" height="793" fill="url(#grid)" />
      </svg>

      <!-- Glowing Orbs -->
      <div style="position: absolute; top: -150px; left: -150px; width: 500px; height: 500px; background: radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(99,102,241,0) 70%); border-radius: 50%; z-index: 2;"></div>
      <div style="position: absolute; bottom: -200px; right: -100px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(16,185,129,0) 70%); border-radius: 50%; z-index: 2;"></div>

      <!-- Outer glowing border -->
      <div style="position: absolute; top: 30px; bottom: 30px; left: 30px; right: 30px; border: 2px solid rgba(99,102,241,0.5); border-radius: 16px; z-index: 10; box-shadow: inset 0 0 20px rgba(99,102,241,0.2), 0 0 20px rgba(99,102,241,0.2); pointer-events: none;"></div>
      
      <!-- Inner thin border -->
      <div style="position: absolute; top: 45px; bottom: 45px; left: 45px; right: 45px; border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; z-index: 10; pointer-events: none;"></div>
      
      <!-- Content Wrapper -->
      <div style="position: relative; z-index: 20; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; padding-top: 100px;">
        
        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 20px;">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <h3 style="color: #10b981; font-size: 20px; font-weight: 700; letter-spacing: 6px; margin: 0; text-transform: uppercase;">CODEMENTOR AI</h3>
        </div>
        
        <h1 style="color: #ffffff; font-size: 52px; font-weight: 800; letter-spacing: 4px; margin: 0; margin-bottom: 40px; text-transform: uppercase; text-shadow: 0 0 15px rgba(255,255,255,0.3);">CERTIFICATE OF ACHIEVEMENT</h1>
        
        <p style="color: #94a3b8; font-size: 18px; margin: 0; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px;">This document certifies that</p>
        
        <!-- User Name -->
        <h2 style="color: #ffffff; font-size: 64px; font-weight: 700; margin: 0; margin-bottom: 20px; text-shadow: 0 0 20px rgba(255,255,255,0.5);">${userName}</h2>
        
        <div style="width: 150px; height: 3px; background: linear-gradient(90deg, transparent, #10b981, transparent); margin-bottom: 30px;"></div>
        
        <p style="color: #cbd5e1; font-size: 20px; margin: 0; max-width: 750px; line-height: 1.6;">Has successfully demonstrated advanced proficiency by passing the<br/>AI Certification Exam and completing the curriculum for:</p>
        
        <!-- Course Title -->
        <h2 style="color: #818cf8; font-size: 38px; font-weight: 800; margin: 25px 0 0 0; text-shadow: 0 0 15px rgba(99,102,241,0.4);">${courseName}</h2>
        
        <!-- Footer Info -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 950px; margin-top: auto; margin-bottom: 70px;">
          
          <!-- Left Signature -->
          <div style="text-align: left;">
            <p style="color: #10b981; font-family: monospace; font-size: 14px; margin: 0; margin-bottom: 5px;">SYS.AUTH.SIGNATURE</p>
            <div style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px; width: 280px;">
              <p style="color: #ffffff; font-size: 20px; font-weight: bold; margin: 0; font-family: 'Courier New', monospace; letter-spacing: -1px; white-space: nowrap;">CodeMentor AI</p>
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 0; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">Lead Evaluation Module</p>
          </div>
          
          <!-- Cyber Badge -->
          <div style="width: 50px; height: 50px; position: relative;">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="rgba(16,185,129,0.1)" stroke="#10b981" stroke-width="2"/>
              <polygon points="50,15 85,32 85,68 50,85 15,68 15,32" fill="rgba(99,102,241,0.2)" stroke="#6366f1" stroke-width="2"/>
              <circle cx="50" cy="50" r="12" fill="#ffffff"/>
              <circle cx="50" cy="50" r="18" stroke="#10b981" stroke-width="1" stroke-dasharray="4 4"/>
            </svg>
          </div>

          <!-- Right Signature -->
          <div style="text-align: right;">
            <p style="color: #6366f1; font-family: monospace; font-size: 14px; margin: 0; margin-bottom: 5px;">TIMESTAMP // LOG</p>
            <div style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px; width: 280px; text-align: right;">
              <p style="color: #ffffff; font-size: 20px; font-weight: bold; margin: 0; font-family: 'Courier New', monospace; white-space: nowrap;">${dateStr}</p>
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 0; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">Official Date of Issue</p>
          </div>
        </div>

      </div>
    </div>
  `;

  container.innerHTML = certificateHTML;

  try {
    const node = document.getElementById("certificate-node");
    if (!node) throw new Error("Template node not found");

    // Wait a brief moment to ensure fonts/layout apply
    await new Promise(r => setTimeout(r, 100));

    // 3. Render HTML to Canvas
    const canvas = await html2canvas(node, {
      scale: 2, // High resolution
      backgroundColor: "#0f172a",
    });

    const imgData = canvas.toDataURL("image/png");

    // 4. Create PDF (A4 landscape is 297x210 mm)
    // We'll use custom dimensions matching our 1122x793 node ratio
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [1122, 793]
    });

    pdf.addImage(imgData, "PNG", 0, 0, 1122, 793);
    
    // 5. Download
    pdf.save(`${userName.replace(/\s+/g, "_")}_${courseName.replace(/\s+/g, "_")}_Certificate.pdf`);

  } catch (error) {
    console.error("Failed to generate PDF:", error);
    alert("Sorry, failed to generate the PDF certificate. Please try again.");
  } finally {
    // Cleanup
    document.body.removeChild(container);
  }
};
