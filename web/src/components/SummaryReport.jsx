export default function SummaryReport({ questions, teacherComment, onTeacherCommentChange }) {
  const total = questions.length;
  const correct = questions.filter((q) => q.status === 'correct').length;
  const incorrect = questions.filter((q) => q.status === 'incorrect').length;
  const partial = questions.filter((q) => q.status === 'partial').length;
  const successRate = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;

  return (
    <div className="glass-panel summary-report fade-slide-in">
      <h3 className="panel-title">Değerlendirme Özeti</h3>
      <div className="summary-stats">
        <div className="stat-tile">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Toplam</div>
        </div>
        <div className="stat-tile correct">
          <div className="stat-value">{correct}</div>
          <div className="stat-label">Doğru</div>
        </div>
        <div className="stat-tile partial">
          <div className="stat-value">{partial}</div>
          <div className="stat-label">Kısmen</div>
        </div>
        <div className="stat-tile incorrect">
          <div className="stat-value">{incorrect}</div>
          <div className="stat-label">Yanlış</div>
        </div>
        <div className="stat-tile rate">
          <div className="stat-value">%{successRate}</div>
          <div className="stat-label">Başarı</div>
        </div>
      </div>

      <div className="question-section">
        <div className="question-section-label">Genel Öğretmen Yorumu</div>
        <textarea
          className="textarea"
          value={teacherComment || ''}
          onChange={(e) => onTeacherCommentChange(e.target.value)}
          placeholder="Ödev hakkında genel bir yorum yazın..."
        />
      </div>
    </div>
  );
}
