import { useRef, useState } from 'react';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // sunucudaki multer limitiyle aynı
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function validateFiles(files) {
  if (files.length > MAX_FILES) {
    return `En fazla ${MAX_FILES} görsel yükleyebilirsiniz (${files.length} dosya seçildi).`;
  }
  const invalidType = files.find((f) => !ALLOWED_TYPES.has(f.type));
  if (invalidType) {
    return `"${invalidType.name}" desteklenmiyor. Sadece JPG, PNG veya WEBP yükleyebilirsiniz.`;
  }
  const tooBig = files.find((f) => f.size > MAX_FILE_SIZE);
  if (tooBig) {
    const mb = (tooBig.size / (1024 * 1024)).toFixed(1);
    return `"${tooBig.name}" çok büyük (${mb} MB). Dosya başına üst sınır 10 MB.`;
  }
  return null;
}

export default function UploadDropzone({ onFilesSelected, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState('');
  const inputRef = useRef(null);

  function acceptFiles(files) {
    if (files.length === 0) return;
    const error = validateFiles(files);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError('');
    onFilesSelected(files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    acceptFiles(e.dataTransfer.files ? Array.from(e.dataTransfer.files) : []);
  }

  function handleInputChange(e) {
    acceptFiles(e.target.files ? Array.from(e.target.files) : []);
    e.target.value = '';
  }

  function handleClick() {
    if (disabled) return;
    inputRef.current && inputRef.current.click();
  }

  if (disabled) {
    return (
      <div className="dropzone disabled fade-slide-in">
        <div className="spinner" />
        <p className="loading-text">AI analiz ediyor...</p>
      </div>
    );
  }

  return (
    <div
      className={`dropzone${isDragging ? ' dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
        Ödev fotoğraflarını buraya sürükleyin
      </p>
      <p>Bir veya birden fazla sayfa sürükleyip bırakın ya da seçmek için tıklayın (JPG, PNG, WEBP — en fazla {MAX_FILES} görsel, dosya başına 10 MB)</p>
      {validationError && (
        <p style={{ color: '#dc2626', fontWeight: 600 }}>{validationError}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleInputChange}
      />
    </div>
  );
}
