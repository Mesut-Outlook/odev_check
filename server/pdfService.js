import fs from 'node:fs';
import PDFDocument from 'pdfkit';

const REGULAR_FONT_PATH = '/usr/share/fonts/TTF/DejaVuSans.ttf';
const BOLD_FONT_PATH = '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf';

export function generateHomeworkPDF(student, homework) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Register Turkish font support if font files exist
      const hasRegularFont = fs.existsSync(REGULAR_FONT_PATH);
      const hasBoldFont = fs.existsSync(BOLD_FONT_PATH);

      const fontReg = hasRegularFont ? REGULAR_FONT_PATH : 'Helvetica';
      const fontBold = hasBoldFont ? BOLD_FONT_PATH : 'Helvetica-Bold';

      doc.font(fontReg);

      // Main Header
      doc.fillColor('#1e293b').font(fontBold).fontSize(20).text('MATEMATİK ÖDEV DEĞERLENDİRME RAPORU', { align: 'center' });
      doc.moveDown(0.8);

      // Calculate stats
      const questions = homework.questions || [];
      const total = questions.length;
      const correct = questions.filter((q) => q.status === 'correct').length;
      const incorrect = questions.filter((q) => q.status === 'incorrect').length;
      const partial = questions.filter((q) => q.status === 'partial').length;
      const successRate = total > 0 ? Math.round((correct / total) * 100) : 0;

      // Save starting Y for the details panel
      const panelStartY = doc.y;
      const panelHeight = 85;

      // Draw bounding box for the details panel
      doc.fillColor('#f8fafc').rect(50, panelStartY, 495, panelHeight).fill();
      doc.strokeColor('#cbd5e1').lineWidth(1).rect(50, panelStartY, 495, panelHeight).stroke();

      // Write Student info (Left Column)
      doc.fillColor('#1e293b').fontSize(10);
      const currentY = panelStartY + 15;

      doc.font(fontBold).text('Öğrenci Bilgileri', 70, currentY);
      doc.font(fontReg).text(`İsim: ${student.name || '—'}`, 70, currentY + 18);
      doc.text(`Tarih: ${new Date(homework.createdAt).toLocaleDateString('tr-TR') || '—'}`, 70, currentY + 32);
      if (student.phone) {
        doc.text(`Telefon: ${student.phone}`, 70, currentY + 46);
      }

      // Write Stats info (Right Column)
      const rightColX = 320;
      doc.font(fontBold).text('Değerlendirme Özeti', rightColX, currentY);
      doc.font(fontReg).text(`Toplam Soru: ${total}`, rightColX, currentY + 18);
      doc.text(`Doğru: ${correct}   |   Kısmen: ${partial}   |   Yanlış: ${incorrect}`, rightColX, currentY + 32);
      
      doc.font(fontBold).fillColor('#1e293b').text('Başarı Skoru: ', rightColX, currentY + 48, { continued: true })
         .font(fontBold).fillColor('#2563eb').text(`%${successRate}`);

      // Set Y position below the details panel
      doc.x = 50;
      doc.y = panelStartY + panelHeight + 20;

      // General Teacher Comment
      if (homework.teacherComment) {
        doc.fillColor('#1e293b').font(fontBold).fontSize(11).text('Öğretmen Genel Yorumu:');
        doc.fillColor('#475569').font(fontReg).fontSize(10).text(homework.teacherComment);
        doc.moveDown(1.5);
      }

      // Questions List
      questions.forEach((q, idx) => {
        // Page break if necessary
        if (doc.y > 650) {
          doc.addPage();
        }

        // Draw Question Header block
        const startY = doc.y;
        let statusText = 'Doğru';
        let statusColor = '#16a34a'; // Green

        if (q.status === 'incorrect') {
          statusText = 'Yanlış';
          statusColor = '#dc2626'; // Red
        } else if (q.status === 'partial') {
          statusText = 'Kısmen Doğru';
          statusColor = '#d97706'; // Orange/Yellow
        }

        doc.fillColor('#f1f5f9').rect(50, startY, 495, 26).fill();
        doc.strokeColor('#cbd5e1').rect(50, startY, 495, 26).stroke();

        doc.fillColor('#1e293b').font(fontBold).fontSize(11).text(`SORU ${q.questionNumber}`, 65, startY + 8, { continued: true });
        doc.fillColor(statusColor).font(fontBold).text(`   [${statusText}]`, { continued: true });
        
        if (q.score !== null && q.score !== undefined) {
          doc.fillColor('#475569').font(fontBold).text(`   Puan: ${q.score}`, { align: 'right' });
        } else {
          doc.text(''); // newline reset
        }

        doc.x = 50;
        doc.y = startY + 35;

        // Question text
        if (q.questionText) {
          doc.fillColor('#0f172a').font(fontBold).fontSize(10).text('Soru Metni: ', { continued: true })
             .font(fontReg).text(q.questionText);
          doc.moveDown(0.4);
        }

        // Student's solution
        doc.fillColor('#0f172a').font(fontBold).fontSize(10).text('Öğrenci Çözümü: ', { continued: true })
           .font(fontReg).text(q.studentSolutionText || '—');
        doc.moveDown(0.2);
        doc.fillColor('#0f172a').font(fontBold).fontSize(10).text('Öğrenci Cevabı: ', { continued: true })
           .font(fontReg).text(q.studentAnswer || '—');
        doc.moveDown(0.4);

        // AI Correct answer and steps
        doc.fillColor('#2563eb').font(fontBold).fontSize(10).text('Doğru Cevap: ', { continued: true })
           .font(fontReg).text(q.correctAnswer || '—');
        
        if (q.correctSolutionSteps && q.correctSolutionSteps.length > 0) {
          doc.fillColor('#334155').font(fontBold).text('Çözüm Adımları:');
          q.correctSolutionSteps.forEach((step, sIdx) => {
            doc.font(fontReg).text(`${sIdx + 1}. ${step}`, { indent: 15 });
          });
        }
        doc.moveDown(0.4);

        // AI Explanation
        if (q.aiExplanation) {
          doc.fillColor('#475569').font(fontBold).text('Değerlendirme Açıklaması:');
          doc.font(fontReg).text(q.aiExplanation, { indent: 10 });
          doc.moveDown(0.4);
        }

        // Teacher's note
        if (q.teacherNote) {
          doc.fillColor('#b45309').font(fontBold).text('Öğretmen Notu:');
          doc.font(fontReg).text(q.teacherNote, { indent: 10 });
        }

        doc.moveDown(1.5);
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
