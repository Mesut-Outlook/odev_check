import { useState } from 'react';

export default function StudentSelector({
  students,
  selectedStudentId,
  onSelect,
  onCreateStudent,
  onUpdateStudent,
  onArchiveStudent,
  onDeleteStudent,
  onHide,
}) {
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState('');

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Filter students by archive status
  const filteredStudents = students.filter((s) => (showArchived ? s.archived : !s.archived));

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) return;
    setCreating(true);
    setError('');
    try {
      await onCreateStudent(trimmedName, newPhone.trim());
      setNewName('');
      setNewPhone('');
    } catch (err) {
      setError(err.message || 'Öğrenci oluşturulamadı.');
    } finally {
      setCreating(false);
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    const trimmedName = editName.trim();
    if (!trimmedName) return;
    setError('');
    try {
      await onUpdateStudent(selectedStudentId, { name: trimmedName, phone: editPhone.trim() });
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Güncelleme başarısız.');
    }
  }

  function startEditing() {
    if (!selectedStudent) return;
    setEditName(selectedStudent.name);
    setEditPhone(selectedStudent.phone || '');
    setEditing(true);
  }

  async function handleArchive() {
    if (!selectedStudent) return;
    setError('');
    try {
      await onArchiveStudent(selectedStudent.id);
    } catch (err) {
      setError(err.message || 'Arşivleme işlemi başarısız.');
    }
  }

  async function handleDelete() {
    if (!selectedStudent) return;
    if (window.confirm(`${selectedStudent.name} adlı öğrenciyi ve bu öğrenciye ait tüm ödev değerlendirmelerini kalıcı olarak silmek istediğinizden emin misiniz?`)) {
      setError('');
      try {
        await onDeleteStudent(selectedStudent.id);
      } catch (err) {
        setError(err.message || 'Silme işlemi başarısız.');
      }
    }
  }

  return (
    <div className="glass-panel fade-slide-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 className="panel-title" style={{ margin: 0 }}>Öğrenciler</h3>
          {onHide && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onHide}
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                lineHeight: 1
              }}
              title="Paneli Gizle"
            >
              ◀ Gizle
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className={`btn${!showArchived ? ' active' : ''}`}
            onClick={() => {
              setShowArchived(false);
              onSelect(null);
            }}
            style={{
              fontSize: '0.8rem',
              padding: '4px 8px',
              backgroundColor: !showArchived ? 'var(--primary-color, #2563eb)' : 'transparent',
              color: !showArchived ? 'white' : 'var(--text-secondary, #475569)',
              borderColor: !showArchived ? 'var(--primary-color, #2563eb)' : 'var(--border-color, #cbd5e1)',
              fontWeight: 600
            }}
          >
            Aktifler
          </button>
          <button
            type="button"
            className={`btn${showArchived ? ' active' : ''}`}
            onClick={() => {
              setShowArchived(true);
              onSelect(null);
            }}
            style={{
              fontSize: '0.8rem',
              padding: '4px 8px',
              backgroundColor: showArchived ? '#d97706' : 'transparent',
              color: showArchived ? 'white' : 'var(--text-secondary, #475569)',
              borderColor: showArchived ? '#d97706' : 'var(--border-color, #cbd5e1)',
              fontWeight: 600
            }}
          >
            Arşivlenmiş
          </button>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <p className="empty-state">
          {showArchived ? 'Arşivlenmiş öğrenci bulunmuyor.' : 'Henüz öğrenci eklenmedi.'}
        </p>
      ) : (
        <div className="student-list">
          {filteredStudents.map((student) => (
            <button
              key={student.id}
              type="button"
              className={`student-chip${student.id === selectedStudentId ? ' selected' : ''}`}
              onClick={() => {
                onSelect(student.id);
                setEditing(false);
              }}
            >
              {student.name} {student.archived && '📦'}
            </button>
          ))}
        </div>
      )}

      {selectedStudent && (
        <div className="selected-student-detail" style={{ marginTop: '12px', padding: '8px', borderTop: '1px solid var(--border-color, #e2e8f0)', fontSize: '0.9rem' }}>
          {editing ? (
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="İsim"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Telefon/WhatsApp (örn: +90505...)"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setEditing(false)} style={{ padding: '4px 8px' }}>İptal</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '4px 8px' }}>Kaydet</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{selectedStudent.name}</strong>
                {selectedStudent.archived && <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>(Arşivlendi)</span>}
                <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>
                  📞 {selectedStudent.phone || 'WhatsApp numarası eklenmemiş'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn" onClick={startEditing} style={{ padding: '2px 6px', fontSize: '0.8rem' }}>
                  Düzenle
                </button>
                <button type="button" className="btn" onClick={handleArchive} style={{ padding: '2px 6px', fontSize: '0.8rem' }}>
                  {selectedStudent.archived ? 'Aktifleştir' : 'Arşivle'}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleDelete}
                  style={{
                    padding: '2px 6px',
                    fontSize: '0.8rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                  }}
                >
                  Sil
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!showArchived && (
        <form className="new-student-form" onSubmit={handleSubmit} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="input"
              placeholder="+ Yeni Öğrenci Adı"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={creating}
              style={{ flex: 1 }}
            />
            <input
              type="text"
              className="input"
              placeholder="WhatsApp Numarası (örn: +90...)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              disabled={creating}
              style={{ flex: 1 }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating || !newName.trim()} style={{ alignSelf: 'flex-end' }}>
            Ekle
          </button>
        </form>
      )}
      {error && <div className="error-banner" style={{ marginTop: '8px' }}>{error}</div>}
    </div>
  );
}
