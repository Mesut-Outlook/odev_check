import { useState } from 'react';

export default function StudentSelector({ students, selectedStudentId, onSelect, onCreateStudent }) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    setError('');
    try {
      await onCreateStudent(trimmed);
      setNewName('');
    } catch (err) {
      setError(err.message || 'Öğrenci oluşturulamadı.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="glass-panel fade-slide-in">
      <h3 className="panel-title">Öğrenciler</h3>

      {students.length === 0 ? (
        <p className="empty-state">Henüz öğrenci eklenmedi.</p>
      ) : (
        <div className="student-list">
          {students.map((student) => (
            <button
              key={student.id}
              type="button"
              className={`student-chip${student.id === selectedStudentId ? ' selected' : ''}`}
              onClick={() => onSelect(student.id)}
            >
              {student.name}
            </button>
          ))}
        </div>
      )}

      <form className="new-student-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="input"
          placeholder="+ Yeni Öğrenci"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={creating}
        />
        <button type="submit" className="btn btn-primary" disabled={creating || !newName.trim()}>
          Ekle
        </button>
      </form>
      {error && <div className="error-banner" style={{ marginTop: '8px' }}>{error}</div>}
    </div>
  );
}
