import { Fragment, useEffect, useState } from 'react';
import {
  listStudents,
  createStudent,
  updateStudent,
  archiveStudent,
  deleteStudent,
  deleteEvaluation,
  clearAllEvaluations,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

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

  async function handleCreateStudent(name, phone = '') {
    const student = await createStudent(name, phone);
    setStudents((prev) => [...prev, student]);
    setSelectedStudentId(student.id);
  }

  async function handleUpdateStudent(studentId, fields) {
    const updated = await updateStudent(studentId, fields);
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
  }

  async function handleArchiveStudent(studentId) {
    const updated = await archiveStudent(studentId);
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
      setCurrentHomework(null);
    }
  }

  async function handleDeleteStudent(studentId) {
    await deleteStudent(studentId);
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
      setCurrentHomework(null);
    }
  }

  async function handleDeleteEvaluation(e, homeworkId) {
    e.stopPropagation();
    if (window.confirm('Bu ödev değerlendirme kaydını kalıcı olarak silmek istediğinizden emin misiniz?')) {
      setError('');
      try {
        await deleteEvaluation(selectedStudentId, homeworkId);
        if (currentHomework && currentHomework.homeworkId === homeworkId) {
          setCurrentHomework(null);
        }
        refreshHistory(selectedStudentId);
      } catch (err) {
        setError(err.message || 'Silme işlemi başarısız.');
      }
    }
  }

  async function handleClearAllEvaluations() {
    if (window.confirm('Bu öğrenciye ait TÜM ödev değerlendirme geçmişini kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      setError('');
      try {
        await clearAllEvaluations(selectedStudentId);
        setCurrentHomework(null);
        refreshHistory(selectedStudentId);
      } catch (err) {
        setError(err.message || 'Temizleme işlemi başarısız.');
      }
    }
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
      <header className="app-header glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px' }}>
        <div
          className="brand-container"
          onClick={() => {
            setSelectedStudentId(null);
            setCurrentHomework(null);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', userSelect: 'none' }}
        >
          <img
            src="/logo.jpeg"
            alt="Logo"
            style={{
              height: '52px',
              width: '52px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--primary-color, #2563eb)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--text-primary), var(--primary-color, #2563eb))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Matematik Ödev Kontrol Sistemi
            </h1>
            <div className="subtitle" style={{ margin: 0, opacity: 0.85 }}>AI destekli ödev değerlendirme</div>
          </div>
        </div>
        <button type="button" className="btn theme-toggle" onClick={toggleTheme} title="Tema değiştir">
          {activeTheme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="main-grid" style={{ gridTemplateColumns: isSidebarOpen ? '320px 1fr' : '1fr' }}>
        {isSidebarOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', position: 'relative' }}>
            <StudentSelector
              students={students}
              selectedStudentId={selectedStudentId}
              onSelect={setSelectedStudentId}
              onCreateStudent={handleCreateStudent}
              onUpdateStudent={handleUpdateStudent}
              onArchiveStudent={handleArchiveStudent}
              onDeleteStudent={handleDeleteStudent}
              onHide={() => setIsSidebarOpen(false)}
            />

            {selectedStudentId && (
              <div className="glass-panel fade-slide-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 className="panel-title" style={{ margin: 0 }}>Geçmiş Değerlendirmeler</h3>
                  {history.length > 0 && (
                    <button
                      type="button"
                      className="btn"
                      onClick={handleClearAllEvaluations}
                      style={{ fontSize: '0.8rem', padding: '4px 8px', color: '#dc2626', borderColor: '#dc2626' }}
                    >
                      Tümünü Temizle
                    </button>
                  )}
                </div>
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
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <div>
                              <div>{new Date(item.createdAt).toLocaleString('tr-TR')}</div>
                              <div className="history-item-meta">
                                {item.status === 'final' ? 'Tamamlandı' : 'Taslak'} · Başarı %
                                {item.summary ? item.summary.successRate : 0}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-icon"
                              onClick={(e) => handleDeleteEvaluation(e, item.homeworkId)}
                              title="Değerlendirme kaydını sil"
                              style={{ padding: '4px 8px', marginLeft: '8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem' }}
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </Fragment>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {!isSidebarOpen && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsSidebarOpen(true)}
              style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '0.85rem' }}
            >
              ▶ Öğrenci Listesini Göster
            </button>
          )}
          {selectedStudentId ? (
            <>
              <UploadDropzone onFilesSelected={handleFilesSelected} disabled={isEvaluating} />
              {currentHomework && (
                <EvaluationView
                  homework={currentHomework}
                  student={selectedStudent}
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
