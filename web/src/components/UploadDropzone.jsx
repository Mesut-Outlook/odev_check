import { useRef, useState } from 'react';

export default function UploadDropzone({ onFilesSelected, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

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
    const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (files.length > 0) onFilesSelected(files);
  }

  function handleInputChange(e) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) onFilesSelected(files);
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
        <p className="loading-text">Gemini ödevi analiz ediyor...</p>
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
      <p>Bir veya birden fazla sayfa sürükleyip bırakın ya da seçmek için tıklayın (JPG, PNG, WEBP)</p>
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
