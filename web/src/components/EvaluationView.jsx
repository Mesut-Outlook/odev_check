import { useState, useRef } from 'react';
import { imageUrl, saveEvaluation } from '../api.js';
import QuestionCard from './QuestionCard.jsx';
import SummaryReport from './SummaryReport.jsx';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.2;

export default function EvaluationView({ homework, student, studentId, onSaved }) {
  const [questions, setQuestions] = useState(homework.questions || []);
  const [teacherComment, setTeacherComment] = useState(homework.teacherComment || '');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isPanning, setIsPanning] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const viewportRef = useRef(null);

  const handleMouseDown = (e) => {
    if (zoom <= 1) return; // Only pan when zoomed in
    setIsPanning(true);
    setStartX(e.pageX - viewportRef.current.offsetLeft);
    setStartY(e.pageY - viewportRef.current.offsetTop);
    setScrollLeft(viewportRef.current.scrollLeft);
    setScrollTop(viewportRef.current.scrollTop);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    e.preventDefault();
    const x = e.pageX - viewportRef.current.offsetLeft;
    const y = e.pageY - viewportRef.current.offsetTop;
    const walkX = (x - startX) * 1.5; // Scroll speed multiplier
    const walkY = (y - startY) * 1.5;
    viewportRef.current.scrollLeft = scrollLeft - walkX;
    viewportRef.current.scrollTop = scrollTop - walkY;
  };

  const buildWhatsAppMessage = () => {
    const total = questions.length;
    const correct = questions.filter(q => q.status === 'correct').length;
    const successRate = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    let msg = `Merhaba *${student?.name || 'Öğrenci'}*,\n\n`;
    msg += `📝 *${new Date(homework.createdAt).toLocaleDateString('tr-TR')}* tarihli Matematik Ödeviniz değerlendirildi.\n`;
    msg += `📊 *Başarı Durumu:* %${successRate} (${total} Soruda ${correct} Doğru)\n`;
    if (teacherComment) {
      msg += `💬 *Öğretmen Genel Yorumu:* "${teacherComment}"\n`;
    }
    msg += `\n🔍 *Soru Detayları:* \n`;
    questions.forEach(q => {
      const statusSymbol = q.status === 'correct' ? '✅' : q.status === 'incorrect' ? '❌' : '⚠️';
      const scorePart = q.score !== null && q.score !== undefined ? ` (Puan: ${q.score})` : '';
      msg += `${q.questionNumber}. Soru: ${statusSymbol}${scorePart}\n`;
      if (q.teacherNote) {
        msg += `   └─ Not: "${q.teacherNote}"\n`;
      }
    });

    const reportUrl = `${window.location.origin}/api/evaluations/${studentId}/${homework.homeworkId}/pdf`;
    msg += `\n📄 *Detaylı PDF Raporu:* ${reportUrl}\n`;
    return encodeURIComponent(msg);
  };

  const handleWhatsAppClick = () => {
    if (!student?.phone) {
      alert("Lütfen önce öğrenci detayından bir WhatsApp telefon numarası kaydedin.");
      return;
    }
    const msg = buildWhatsAppMessage();
    const cleanPhone = student.phone.replace(/[^0-9+]/g, ''); // leave only numbers and '+'
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
    window.open(url, '_blank');
  };

  const images = homework.images || [];
  const pageCount = images.length;

  function handleQuestionChange(updatedQuestion) {
    setSaved(false);
    setQuestions((prev) =>
      prev.map((q) => (q.questionNumber === updatedQuestion.questionNumber ? updatedQuestion : q))
    );
  }

  function handleTeacherCommentChange(value) {
    setSaved(false);
    setTeacherComment(value);
  }

  function zoomIn() {
    setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 10) / 10));
  }

  function zoomOut() {
    setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 10) / 10));
  }

  function rotateLeft() {
    setRotation((r) => (r - 90 + 360) % 360);
  }

  function rotateRight() {
    setRotation((r) => (r + 90) % 360);
  }

  function goToPage(index) {
    if (index < 0 || index >= pageCount) return;
    setActiveImageIndex(index);
    setZoom(1);
    setRotation(0);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated = await saveEvaluation(studentId, homework.homeworkId, {
        questions,
        teacherComment,
      });
      setSaved(true);
      onSaved && onSaved(updated);
    } catch (err) {
      setError(err.message || 'Kaydetme sırasında bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`evaluation-columns fade-slide-in${isFullscreen ? ' fullscreen' : ''}`}>
      <div className="image-panel glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 className="panel-title" style={{ margin: 0 }}>Ödev Görseli</h3>
          <button
            type="button"
            className="btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{ fontSize: '0.8rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>{isFullscreen ? '⛶ Kapat' : '⛶ Tam Ekran'}</span>
          </button>
        </div>
        <div
          className="image-viewport"
          ref={viewportRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '350px'
          }}
        >
          <img
            src={imageUrl(studentId, homework.homeworkId, activeImageIndex)}
            alt={`Ödev sayfa ${activeImageIndex + 1}`}
            style={{
              width: `${100 * zoom}%`,
              height: 'auto',
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'width 0.15s ease, transform 0.15s ease',
              display: 'block'
            }}
          />
        </div>
        <div className="zoom-controls">
          <button type="button" className="btn btn-icon" onClick={zoomOut} disabled={zoom <= MIN_ZOOM}>
            −
          </button>
          <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            %{Math.round(zoom * 100)}
          </span>
          <button type="button" className="btn btn-icon" onClick={zoomIn} disabled={zoom >= MAX_ZOOM}>
            +
          </button>
        </div>

        <div className="rotate-controls">
          <button type="button" className="btn btn-icon" onClick={rotateLeft} title="Sola döndür">
            ↺
          </button>
          <button type="button" className="btn btn-icon" onClick={rotateRight} title="Sağa döndür">
            ↻
          </button>
        </div>

        <div className="page-nav">
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => goToPage(activeImageIndex - 1)}
            disabled={activeImageIndex <= 0}
          >
            ‹ Önceki
          </button>
          <span className="page-indicator">
            Sayfa {pageCount === 0 ? 0 : activeImageIndex + 1} / {pageCount}
          </span>
          <button
            type="button"
            className="btn btn-icon"
            onClick={() => goToPage(activeImageIndex + 1)}
            disabled={activeImageIndex >= pageCount - 1}
          >
            Sonraki ›
          </button>
        </div>

        <div className="thumbnail-strip">
          {images.map((img, i) => (
            <img
              key={img.index}
              src={imageUrl(studentId, homework.homeworkId, i)}
              alt={`Sayfa ${i + 1} küçük resmi`}
              className={`thumbnail${i === activeImageIndex ? ' active' : ''}`}
              onClick={() => goToPage(i)}
            />
          ))}
        </div>
      </div>

      <div className="questions-column">
        <SummaryReport
          questions={questions}
          teacherComment={teacherComment}
          onTeacherCommentChange={handleTeacherCommentChange}
        />

        <div className="questions-panel">
          {questions.map((q) => (
            <QuestionCard key={q.questionNumber} question={q} onChange={handleQuestionChange} />
          ))}
        </div>

        <div className="save-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
          {error && <div className="error-banner" style={{ width: '100%' }}>{error}</div>}
          {saved && !saving && (
            <span style={{ color: 'var(--color-correct)', fontSize: '0.85rem', fontWeight: 600, marginRight: 'auto' }}>
              Kaydedildi
            </span>
          )}
          <button type="button" className="btn" onClick={() => window.open(`/api/evaluations/${studentId}/${homework.homeworkId}/pdf`, '_blank')} title="Değerlendirme sonucunu PDF olarak görüntüle/indir">
            📄 PDF Raporu
          </button>
          <button type="button" className="btn" onClick={handleWhatsAppClick} title="Değerlendirmeyi WhatsApp ile öğrenciye gönder" style={{ backgroundColor: '#25D366', color: 'white', border: 'none', fontWeight: 600 }}>
            💬 WhatsApp ile Gönder
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
