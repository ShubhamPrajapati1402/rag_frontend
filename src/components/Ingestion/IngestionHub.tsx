import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  FileBox, 
  CheckCircle2, 
  Clock, 
  Search, 
  Trash2, 
  Eye, 
  X,
  FileCheck,
  FolderOpen,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import { DocumentItem } from '../../types';
import { chatApi } from '../../services/chatApi';
import './IngestionHub.css';

interface IngestionHubProps {
  documents: DocumentItem[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>;
  onUpdateDocCount?: (count: number) => void;
}

export default function IngestionHub({ documents, setDocuments, onUpdateDocCount }: IngestionHubProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [copiedPreview, setCopiedPreview] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; progress: number } | null>(null);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCopyPreview = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  const handleOpenPreview = async (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setIsPreviewLoading(true);
    try {
      const previewData = await chatApi.getDocumentPreview(doc.id);
      if (previewData) {
        setSelectedDoc(prev => prev && prev.id === doc.id ? { ...prev, ...previewData } : prev);
      }
    } catch (err) {
      console.warn('Failed to load full preview:', err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        uploadFile(file);
      });
    }
  };

  const handleBrowseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        uploadFile(file);
      });
      e.target.value = ''; // Reset file input to prevent double triggers
    }
  };

  const uploadFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toUpperCase() || 'TXT';
    let format = ext;
    if (ext === 'XLSX' || ext === 'XLS') format = 'Excel';
    
    // Accurate size formatting to prevent 0 KB
    const sizeKB = file.size / 1024;
    const sizeStr = sizeKB > 1024 
      ? `${(sizeKB / 1024).toFixed(1)} MB` 
      : sizeKB < 0.1 
        ? `${file.size} B` 
        : `${sizeKB.toFixed(1)} KB`;

    setUploadProgress({ name: file.name, progress: 0 });
    setPipelineLogs([`[01/05] Reading document bytes and metadata...`]);

    try {
      await chatApi.streamUpload({
        file,
        onProgress: (p) => {
          setUploadProgress({ name: file.name, progress: p.percent });
          setPipelineLogs(logs => {
            const newLine = `[${p.stage.toUpperCase()}] ${p.message}`;
            if (logs.includes(newLine)) return logs;
            return [...logs, newLine];
          });
        },
        onDone: (data) => {
          setUploadProgress({ name: file.name, progress: 100 });
          setPipelineLogs(logs => [...logs, `[SUCCESS] Document ingestion and vector space indexing complete!`]);
          
          setTimeout(() => {
            const docObj = data?.document || data?.data || data || {};
            const finalSummary = docObj.summary || docObj.description || `Semantic boundary index containing chunks for ${file.name}.`;
            const finalPreview = docObj.previewText || docObj.preview_text || docObj.preview || docObj.content || docObj.text || docObj.sample || docObj.sample_text || 'All structural text regions and tokens indexed inside vector space.';

            const newDoc: DocumentItem = {
              id: String(docObj.id || docObj.doc_id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
              name: docObj.name || docObj.filename || docObj.file_name || file.name,
              format: docObj.format || docObj.fileType || docObj.file_type || format,
              size: docObj.size || sizeStr,
              status: 'ready',
              date: 'Just now',
              summary: String(finalSummary),
              previewText: String(finalPreview)
            };
            setDocuments(curr => {
              // Deduplicate to prevent double-insert bugs
              if (curr.some(d => d.name === newDoc.name && d.size === newDoc.size)) {
                return curr;
              }
              return [newDoc, ...curr];
            });
            setUploadProgress(null);
            if (onUpdateDocCount) onUpdateDocCount(documents.length + 1);
          }, 600);
        },
        onError: (err) => {
          setPipelineLogs(logs => [...logs, `[ERROR] ${err.message || err}`]);
          setTimeout(() => setUploadProgress(null), 4000);
        }
      });
    } catch (err: any) {
      setPipelineLogs(logs => [...logs, `[ERROR] ${err.message || err}`]);
      setTimeout(() => setUploadProgress(null), 4000);
    }
  };

  const handleDelete = async (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    const confirmed = window.confirm(`Are you sure you want to permanently delete "${doc.name}"? This will also remove all associated vector search indexes.`);
    if (!confirmed) return;

    try {
      const ok = await chatApi.deleteDocument(id);
      if (ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        if (onUpdateDocCount) onUpdateDocCount(documents.length - 1);
      } else {
        alert('Failed to delete document from server.');
      }
    } catch (err: any) {
      alert(`Error deleting document: ${err.message || err}`);
    }
  };

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ingestion-clean-root anim-fade-in">
      <div className="ingestion-content-wrap">
        {/* Page Header */}
        <div className="page-header">
          <h2>Document Library</h2>
          <p>Upload your PDFs, Word documents, Excel spreadsheets, or CSVs to query them in chat.</p>
        </div>

        {/* Drag & Drop Zone */}
        <div 
          className={`dropzone-box ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="dropzone-icon-glow">
            <UploadCloud size={32} />
          </div>
          <h3>Drag and drop files here</h3>
          <p>Supports PDF, DOCX, XLSX, CSV, PPTX, Markdown, and TXT</p>
          
          <div className="dropzone-actions-bar">
            <button 
              className="btn-browse-file"
              onClick={handleBrowseClick}
            >
              Browse files
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
              multiple
              accept=".pdf,.docx,.xlsx,.xls,.csv,.pptx,.md,.txt"
            />
            <span className="max-size-hint">Maximum upload size: 50MB</span>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {uploadProgress && (
          <div className="upload-progress-card anim-slide-up">
            <div className="progress-info">
              <span className="file-uploading-name">{uploadProgress.name}</span>
              <span className="percent-text">{uploadProgress.progress}%</span>
            </div>
            <div className="progress-track-bar">
              <div 
                className="progress-fill-bar" 
                style={{ width: `${uploadProgress.progress}%` }}
              ></div>
            </div>

            {/* Pipeline Vector Indexing Logs Terminal */}
            <div className="pipeline-terminal-box">
              <div className="terminal-header">
                <span className="terminal-dot red"></span>
                <span className="terminal-dot yellow"></span>
                <span className="terminal-dot green"></span>
                <span className="terminal-title">Vector Ingestion Pipeline Log</span>
              </div>
              <div className="terminal-body">
                {pipelineLogs.map((log, idx) => (
                  <div key={idx} className="terminal-log-line">
                    <span className="terminal-log-bullet">&gt;</span> {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Documents Table / List Card */}
        <div className="doc-table-card">
          <div className="table-top-toolbar">
            <div className="search-input-box">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Filter documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="table-count-label">
              Showing {filteredDocs.length} of {documents.length} files
            </div>
          </div>

          <div className="clean-table-viewport">
            {documents.length === 0 ? (
              <div className="table-empty-state anim-fade-in">
                <div className="empty-state-icon-box">
                  <FolderOpen size={32} />
                </div>
                <p className="empty-state-title">No documents ingested yet</p>
                <span className="empty-state-sub">Upload files using the dropzone above to start neural indexing and semantic search.</span>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="table-empty-state anim-fade-in">
                <p className="empty-state-title">No matching documents found</p>
                <span className="empty-state-sub">Try searching with a different filename keyword.</span>
              </div>
            ) : (
              <table className="clean-docs-table">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>FORMAT</th>
                    <th>SIZE</th>
                    <th>STATUS</th>
                    <th>UPLOADED</th>
                    <th className="text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="doc-table-row">
                      <td className="cell-doc-name">
                        <span className="table-file-icon">
                          {doc.format === 'PDF' && <FileText size={16} className="text-rose-500" />}
                          {doc.format === 'Excel' && <FileSpreadsheet size={16} className="text-emerald-500" />}
                          {doc.format === 'CSV' && <FileSpreadsheet size={16} className="text-emerald-500" />}
                          {doc.format === 'Markdown' && <FileCode size={16} className="text-blue-500" />}
                          {doc.format !== 'PDF' && doc.format !== 'Excel' && doc.format !== 'CSV' && doc.format !== 'Markdown' && <FileBox size={16} />}
                        </span>
                        <span className="name-text-strong" title={doc.name}>{doc.name}</span>
                      </td>
                      <td>
                        <span className="pill-format">{doc.format}</span>
                      </td>
                      <td className="cell-muted">{doc.size}</td>
                      <td>
                        <span className={`pill-status ${doc.status}`}>
                          {doc.status === 'ready' && <CheckCircle2 size={12} />}
                          {doc.status === 'processing' && <Clock size={12} />}
                          <span>{doc.status}</span>
                        </span>
                      </td>
                      <td className="cell-muted">{doc.date}</td>
                      <td className="text-right">
                        <div className="actions-cluster">
                          <button 
                            className="table-action-icon-btn" 
                            onClick={() => handleOpenPreview(doc)}
                            title="Preview Document Information"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            className="table-action-icon-btn text-danger" 
                            onClick={() => handleDelete(doc.id)}
                            title="Delete Document"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Document Details Drawer / Modal */}
      {selectedDoc && (
        <div className="drawer-overlay anim-fade-in" onClick={() => setSelectedDoc(null)}>
          <div className="drawer-card anim-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-top-bar">
              <div className="drawer-title-box">
                <FileCheck size={20} className="text-accent" />
                <div>
                  <h4>{selectedDoc.name}</h4>
                  <span className="drawer-loc">{selectedDoc.format} • {selectedDoc.size} • {selectedDoc.date}</span>
                </div>
              </div>
              <button className="drawer-close" onClick={() => setSelectedDoc(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-content-box">
              <div className="drawer-section-heading">
                <Sparkles size={13} className="text-accent" />
                <span>AI DOCUMENT SUMMARY</span>
              </div>
              <div className="drawer-summary-card">
                <p className="drawer-summary">{selectedDoc.summary || 'Document successfully indexed and tokenized into pgvector space.'}</p>
              </div>

              <div className="drawer-section-heading preview-header-row">
                <div className="heading-with-icon">
                  <FileText size={13} className="text-accent" />
                  <span>EXTRACTED PASSAGE PREVIEW</span>
                </div>
                {selectedDoc.previewText && (
                  <button 
                    className={`btn-copy-preview ${copiedPreview ? 'copied' : ''}`}
                    onClick={() => handleCopyPreview(selectedDoc.previewText)}
                    title="Copy extracted text"
                  >
                    {copiedPreview ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedPreview ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              <div className="preview-text-container">
                {isPreviewLoading ? (
                  <div className="preview-loading-box">
                    <span className="loading-spinner-dot"></span>
                    <span>Loading extracted vector passages...</span>
                  </div>
                ) : (
                  <div className="preview-text-block">
                    {selectedDoc.previewText || 'No text snippet available.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
