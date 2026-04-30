import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { db } from './firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export const generateAndSaveCertificate = async (
  userId: string,
  userName: string,
  courseId: string,
  courseTitle: string
) => {
  // 1. Get the template element (it should be rendered somewhere in the DOM, possibly hidden)
  const element = document.getElementById('certificate-template');
  if (!element) {
    throw new Error('Certificate template element not found');
  }

  try {
    // 2. Convert HTML to Canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.9);

    // 3. Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [800, 600]
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, 800, 600);
    
    // Get Base64 string
    const pdfBase64 = pdf.output('datauristring');

    // 4. Update user profile in Firestore
    const userRef = doc(db, 'users', userId);
    const date = new Date().toISOString();
    
    const certificateData = {
      courseId,
      courseTitle,
      issueDate: date,
      certificateUrl: pdfBase64
    };

    await updateDoc(userRef, {
      completedCourses: arrayUnion(courseId),
      certificates: arrayUnion(certificateData)
    });

    return {
      pdf,
      certificateData
    };
  } catch (error: any) {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType: 'update',
      path: `users/${userId}`,
      authInfo: {
        userId: userId
      }
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }
};
