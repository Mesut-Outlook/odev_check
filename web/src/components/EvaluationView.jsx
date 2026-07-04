import { useState } from 'react';
import { imageUrl, saveEvaluation } from '../api.js';
import QuestionCard from './QuestionCard.jsx';
import SummaryReport from './SummaryReport.jsx';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.2;

export default function EvaluationView({ homework, studentId, onSaved }) {
  const [questions, setQuestions] = useState(homework.questions || []);
  const [teacherComment, setTeacherComment] = useState(homework.teacherComment || '');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

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
    <div className="evaluation-columns fade-slide-in">
      <div className="image-panel glass-panel">
        <h3 className="panel-title">Ödev Görseli</h3>
        <div className="image-viewport">
          <img
            src={imageUrl(studentId, homework.homeworkId, activeImageIndex)}
            alt={`Ödev sayfa ${activeImageIndex + 1}`}
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
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

        <div className="save-bar">
          {error && <div className="error-banner">{error}</div>}
          {saved && !saving && (
            <span style={{ color: 'var(--color-correct)', fontSize: '0.85rem', fontWeight: 600 }}>
              Kaydedildi
            </span>
          )}
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
