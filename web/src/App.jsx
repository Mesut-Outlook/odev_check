import { Fragment, useEffect, useState } from 'react';
import {
  listStudents,
  createStudent,
  evaluateHomework,
  listEvaluations,
  getEvaluation,
} from './api.js';
import StudentSelector from './components/StudentSelector.jsx';
import UploadDropzone from './components/UploadDropzone.jsx';
import EvaluationView from './components/EvaluationView.jsx';

function getInitialTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return null;
}

function formatGroupLabel(date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Bugün';
  if (date.toDateString() === yesterday.toDateString()) return 'Dün';
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function groupHistoryByDate(history) {
  const groups = [];
  const groupsByKey = new Map();

  for (const item of history) {
    const date = new Date(item.createdAt);
    const key = date.toDateString();
    let group = groupsByKey.get(key);
    if (!group) {
      group = { label: formatGroupLabel(date), items: [] };
      groupsByKey.set(key, group);
      groups.push(group);
    }
    group.items.push(item);
  }

  return groups;
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme());
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentHomework, setCurrentHomework] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (theme) {
      document.documentElement.dataset.theme = theme;
    } else {
      delete document.documentElement.dataset.theme;
    }
  }, [theme]);

  useEffect(() => {
    listStudents()
      .then(setStudents)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setHistory([]);
      return;
    }
    refreshHistory(selectedStudentId);
    setCurrentHomework(null);
  }, [selectedStudentId]);

  function refreshHistory(studentId) {
    listEvaluations(studentId)
      .then(setHistory)
      .catch((err) => setError(err.message));
  }

  function toggleTheme() {
    setTheme((prev) => {
      const current = prev || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  }

  async function handleCreateStudent(name) {
    const student = await createStudent(name);
    setStudents((prev) => [...prev, student]);
    setSelectedStudentId(student.id);
  }

  async function handleFilesSelected(files) {
    if (!selectedStudentId) return;
    setIsEvaluating(true);
    setError('');
    try {
      const result = await evaluateHomework(selectedStudentId, files);
      setCurrentHomework(result);
      refreshHistory(selectedStudentId);
    } catch (err) {
      setError(err.message || 'Değerlendirme sırasında bir hata oluştu.');
    } finally {
      setIsEvaluating(false);
    }
  }

  async function handleOpenHistoryItem(homeworkId) {
    setError('');
    try {
      const record = await getEvaluation(selectedStudentId, homeworkId);
      setCurrentHomework(record);
    } catch (err) {
      setError(err.message || 'Kayıt açılamadı.');
    }
  }

  function handleSaved(updatedRecord) {
    setCurrentHomework(updatedRecord);
    refreshHistory(selectedStudentId);
  }

  const activeTheme = theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  return (
    <div className="app-shell">
      <header className="app-header glass-panel">
        <div>
          <h1>Matematik Ödev Kontrol Sistemi</h1>
          <div className="subtitle">Gemini AI destekli ödev değerlendirme</div>
        </div>
        <button type="button" className="btn theme-toggle" onClick={toggleTheme} title="Tema değiştir">
          {activeTheme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="main-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <StudentSelector
            students={students}
            selectedStudentId={selectedStudentId}
            onSelect={setSelectedStudentId}
            onCreateStudent={handleCreateStudent}
          />

          {selectedStudentId && (
            <div className="glass-panel fade-slide-in">
              <h3 className="panel-title">Geçmiş Değerlendirmeler</h3>
              {history.length === 0 ? (
                <p className="empty-state">Henüz değerlendirme yok.</p>
              ) : (
                <div className="history-list">
                  {groupHistoryByDate(history).map((group) => (
                    <Fragment key={group.items[0].homeworkId}>
                      <div className="history-date-label">{group.label}</div>
                      {group.items.map((item) => (
                        <div
                          key={item.homeworkId}
                          className={`history-item${currentHomework && currentHomework.homeworkId === item.homeworkId ? ' active' : ''}`}
                          onClick={() => handleOpenHistoryItem(item.homeworkId)}
                        >
                          <div>
                            <div>{new Date(item.createdAt).toLocaleString('tr-TR')}</div>
                            <div className="history-item-meta">
                              {item.status === 'final' ? 'Tamamlandı' : 'Taslak'} · Başarı %
                              {item.summary ? item.summary.successRate : 0}
                            </div>
                          </div>
                        </div>
                      ))}
                    </Fragment>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {selectedStudentId ? (
            <>
              <UploadDropzone onFilesSelected={handleFilesSelected} disabled={isEvaluating} />
              {currentHomework && (
                <EvaluationView
                  homework={currentHomework}
                  studentId={selectedStudentId}
                  onSaved={handleSaved}
                />
              )}
            </>
          ) : (
            <div className="glass-panel empty-state">
              Başlamak için bir öğrenci seçin veya yeni öğrenci ekleyin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
