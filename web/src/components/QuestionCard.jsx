const STATUS_LABELS = {
  correct: 'Doğru',
  partial: 'Kısmen Doğru',
  incorrect: 'Yanlış',
};

export default function QuestionCard({ question, onChange }) {
  const {
    questionNumber,
    questionText,
    studentSolutionText,
    correctSolutionSteps,
    correctAnswer,
    studentAnswer,
    status,
    aiExplanation,
    score,
    teacherNote,
  } = question;

  function handleStatusChange(newStatus) {
    onChange({ ...question, status: newStatus });
  }

  function handleScoreChange(e) {
    const value = e.target.value;
    onChange({ ...question, score: value === '' ? null : Number(value) });
  }

  function handleNoteChange(e) {
    onChange({ ...question, teacherNote: e.target.value });
  }

  return (
    <div className={`question-card ${status}`}>
      <div className="question-card-header">
        <span className="question-number">Soru {questionNumber}</span>
        <span className={`status-badge ${status}`}>{STATUS_LABELS[status] || status}</span>
      </div>

      {questionText && (
        <div className="question-section">
          <div className="question-section-label">Soru</div>
          <div className="question-section-body">{questionText}</div>
        </div>
      )}

      <div className="question-section">
        <div className="question-section-label">Öğrencinin Çözümü</div>
        <div className="question-section-body">{studentSolutionText || '—'}</div>
      </div>

      <div className="question-section">
        <div className="question-section-label">Öğrencinin Cevabı</div>
        <div className="question-section-body">{studentAnswer || '—'}</div>
      </div>

      <div className="question-section">
        <div className="question-section-label">AI Çözümü</div>
        <div className="ai-solution-box">
          {Array.isArray(correctSolutionSteps) && correctSolutionSteps.length > 0 && (
            <ol>
              {correctSolutionSteps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          )}
          <div className="question-section-body" style={{ marginTop: '8px' }}>
            <strong>Doğru Cevap:</strong> {correctAnswer || '—'}
          </div>
          {aiExplanation && (
            <div className="question-section-body" style={{ marginTop: '8px' }}>
              {aiExplanation}
            </div>
          )}
        </div>
      </div>

      <div className="teacher-controls">
        <div className="status-toggle-group">
          <button
            type="button"
            className={`btn-status correct${status === 'correct' ? ' active' : ''}`}
            onClick={() => handleStatusChange('correct')}
          >
            Doğru
          </button>
          <button
            type="button"
            className={`btn-status partial${status === 'partial' ? ' active' : ''}`}
            onClick={() => handleStatusChange('partial')}
          >
            Kısmen Doğru
          </button>
          <button
            type="button"
            className={`btn-status incorrect${status === 'incorrect' ? ' active' : ''}`}
            onClick={() => handleStatusChange('incorrect')}
          >
            Yanlış
          </button>
        </div>

        <div className="score-input-group">
          <label htmlFor={`score-${questionNumber}`}>Puan:</label>
          <input
            id={`score-${questionNumber}`}
            type="number"
            className="input"
            value={score === null || score === undefined ? '' : score}
            onChange={handleScoreChange}
          />
        </div>
      </div>

      <div className="question-section">
        <div className="question-section-label">Öğretmen Notu</div>
        <textarea
          className="textarea"
          value={teacherNote || ''}
          onChange={handleNoteChange}
          placeholder="Bu soru için not ekleyin..."
        />
      </div>
    </div>
  );
}
