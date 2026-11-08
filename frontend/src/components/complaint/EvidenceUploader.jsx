import React, { useState, useRef } from 'react';
import { 
  Upload, 
  X, 
  FileCheck, 
  Film, 
  Image as ImageIcon, 
  AlertCircle, 
  Sparkles, 
  Eye, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIMES = [
  'image/jpeg', 
  'image/png', 
  'image/webp', 
  'video/mp4', 
  'video/webm', 
  'video/quicktime'
];

export default function EvidenceUploader({ 
  onFilesChange, 
  onPrimaryImageSelect,
  existingFiles = [],
  maxFiles = 5 
}) {
  const [evidenceList, setEvidenceList] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const mime = file.type.toLowerCase();

    // MIME type check
    const isImage = mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    const isVideo = mime.startsWith('video/') || ['.mp4', '.webm', '.mov'].includes(ext);

    if (!isImage && !isVideo) {
      return { 
        valid: false, 
        error: `Unsupported file type "${file.name}". Allowed formats: JPG, PNG, WEBP, MP4, WEBM, MOV.` 
      };
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return { 
        valid: false, 
        error: `Image "${file.name}" exceeds 10 MB limit (${formatFileSize(file.size)}). Please select a compressed file.` 
      };
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return { 
        valid: false, 
        error: `Video "${file.name}" exceeds 50 MB limit (${formatFileSize(file.size)}).` 
      };
    }

    return { valid: true, isImage, isVideo, ext };
  };

  const handleFiles = (incomingFiles) => {
    setErrorMessage('');
    const newItems = [];
    let firstImageFound = null;

    if (evidenceList.length + incomingFiles.length > maxFiles) {
      setErrorMessage(`Maximum ${maxFiles} evidence attachments allowed per complaint.`);
      return;
    }

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];
      const validation = validateFile(file);

      if (!validation.valid) {
        setErrorMessage(validation.error);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      const item = {
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        formattedSize: formatFileSize(file.size),
        type: validation.isVideo ? 'video' : 'image',
        ext: validation.ext.replace('.', '').toUpperCase(),
        status: 'ready'
      };

      newItems.push(item);
      if (!firstImageFound && validation.isImage) {
        firstImageFound = file;
      }
    }

    const updatedList = [...evidenceList, ...newItems];
    setEvidenceList(updatedList);
    
    // Notify parent component
    if (onFilesChange) {
      onFilesChange(updatedList.map(item => item.file));
    }

    // Trigger visual AI evaluation for first primary image
    if (firstImageFound && onPrimaryImageSelect) {
      onPrimaryImageSelect(firstImageFound);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemove = (id) => {
    const itemToRemove = evidenceList.find(item => item.id === id);
    if (itemToRemove && itemToRemove.previewUrl) {
      URL.revokeObjectURL(itemToRemove.previewUrl);
    }
    const updated = evidenceList.filter(item => item.id !== id);
    setEvidenceList(updated);

    if (onFilesChange) {
      onFilesChange(updated.map(item => item.file));
    }

    // If removed first image, notify parent with next image if available
    const nextImage = updated.find(item => item.type === 'image');
    if (onPrimaryImageSelect) {
      onPrimaryImageSelect(nextImage ? nextImage.file : null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Upload Drop Zone */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: dragActive 
            ? '2px dashed var(--accent-primary)' 
            : '2px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 'clamp(16px, 4vw, 24px) clamp(12px, 3vw, 20px)',
          textAlign: 'center',
          background: dragActive 
            ? 'rgba(37, 99, 235, 0.08)' 
            : 'var(--bg-surface-elevated)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: dragActive ? '0 0 20px rgba(37, 99, 235, 0.2)' : 'none'
        }}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(Array.from(e.target.files));
            }
          }}
        />

        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(37, 99, 235, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px'
        }}>
          <Upload size={24} color="var(--accent-primary)" />
        </div>

        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Drag & drop incident photos here
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          or <span style={{ color: 'var(--accent-primary)', textDecoration: 'underline', fontWeight: 600 }}>browse from your device</span>
        </div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          Supported: <strong>JPG, PNG, WebP</strong> (max 10MB) • Up to 1 file
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.82rem',
          color: '#ef4444'
        }}>
          <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Uploaded Evidence Cards Grid */}
      {evidenceList.length > 0 && (
        <div>
          <div style={{ 
            fontSize: '0.82rem', 
            fontWeight: 700, 
            color: 'var(--text-secondary)', 
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>ATTACHED EVIDENCE ({evidenceList.length}/{maxFiles})</span>
            <span style={{ color: 'var(--accent-emerald)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={13} /> Stored via Cloudinary Media Layer
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))',
            gap: '12px'
          }}>
            {evidenceList.map((item, index) => (
              <div 
                key={item.id}
                className="glass-card"
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: index === 0 ? '1px solid rgba(37, 99, 235, 0.5)' : '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Primary Tag for 1st Evidence */}
                {index === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    zIndex: 2,
                    background: 'rgba(14, 165, 233, 0.9)',
                    backdropFilter: 'blur(4px)',
                    color: '#fff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Sparkles size={11} /> Primary Photo
                  </div>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.id);
                  }}
                  title="Remove evidence"
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    zIndex: 2,
                    background: 'rgba(0, 0, 0, 0.75)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#ef4444'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.75)'}
                >
                  <X size={14} />
                </button>

                {/* Media Preview Box */}
                <div style={{
                  width: '100%',
                  height: '120px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: '#090d16',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}>
                  {item.type === 'video' ? (
                    <video 
                      src={item.previewUrl} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      muted 
                    />
                  ) : (
                    <img 
                      src={item.previewUrl} 
                      alt={item.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  )}
                </div>

                {/* File Metadata Details */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {item.formattedSize} • {item.ext}
                    </div>
                  </div>

                  <span className={`badge ${item.type === 'video' ? 'badge-inprogress' : 'badge-assigned'}`} style={{ fontSize: '0.65rem' }}>
                    {item.type === 'video' ? 'VIDEO' : 'IMAGE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
