import { useState } from 'react';
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
  FileCheck
} from 'lucide-react';
import './IngestionHub.css';

export default function IngestionHub({ documents, setDocuments }) {
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    simulateFileUpload('Customer_Satisfaction_Survey_2026.csv', 'CSV', '820 KB');
  };

  const simulateFileUpload = (fileName, format, size) => {
    setUploadProgress({ name: fileName, progress: 20 });

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (!prev) return null;
        if (prev.progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const newDoc = {
              id: `doc-${Date.now()}`,
              name: fileName,
              format: format,
              size: size,
              status: 'ready',
              date: 'Just now',
              summary: 'Structured customer satisfaction ratings, response times, and NPS scores.',
              previewText: 'Customer feedback entries with 98.4% satisfaction rating across 420 response surveys.'
            };
            setDocuments(curr => [newDoc, ...curr]);
            setUploadProgress(null);
            if (onUpdateDocCount) onUpdateDocCount(documents.length + 1);
          }, 400);
          return { ...prev, progress: 100 };
        }
        return { ...prev, progress: prev.progress + 25 };
      });
    }, 200);
  };

  const handleDelete = (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (onUpdateDocCount) onUpdateDocCount(documents.length - 1);
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
          
          <div className="dropzone-actions">
            <button 
              className="upload-file-btn"
              onClick={() => simulateFileUpload('Quarterly_Financial_Report.pdf', 'PDF', '2.4 MB')}
            >
              <UploadCloud size={14} />
              <span>Browse Files</span>
            </button>
          </div>

          {/* Upload Progress Bar Animation */}
          {uploadProgress && (
            <div className="upload-progress-card anim-slide-up">
              <div className="progress-info">
                <span className="file-uploading-name">{uploadProgress.name}</span>
                <span className="progress-percent">{uploadProgress.progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${uploadProgress.progress}%` }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Document Table List */}
        <div className="documents-list-card">
          <div className="table-header-bar">
            <div className="table-search">
              <Search size={14} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search uploaded files..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <span className="doc-count-badge">{filteredDocs.length} files</span>
          </div>

          <div className="files-table">
            <div className="table-row-head">
              <div className="col-name">File Name</div>
              <div className="col-type">Format</div>
              <div className="col-size">Size</div>
              <div className="col-status">Status</div>
              <div className="col-actions">Actions</div>
            </div>

            {filteredDocs.map((doc) => (
              <div key={doc.id} className="table-row-item anim-fade-in">
                <div className="col-name file-title-flex">
                  <span className="file-icon-badge">
                    {doc.format === 'PDF' && <FileText size={16} className="text-accent" />}
                    {doc.format === 'Excel' && <FileSpreadsheet size={16} className="text-cyan" />}
                    {doc.format === 'Markdown' && <FileCode size={16} className="text-accent" />}
                    {doc.format === 'CSV' && <FileBox size={16} className="text-cyan" />}
                  </span>
                  <span className="file-title-text">{doc.name}</span>
                </div>

                <div className="col-type">
                  <span className="type-pill">{doc.format}</span>
                </div>

                <div className="col-size text-muted">
                  {doc.size}
                </div>

                <div className="col-status">
                  <span className="status-ready-pill">
                    <CheckCircle2 size={13} />
                    <span>Ready</span>
                  </span>
                </div>

                <div className="col-actions">
                  <button 
                    className="row-action-btn"
                    onClick={() => setSelectedDoc(doc)}
                    title="Preview Document Content"
                  >
                    <Eye size={14} />
                  </button>
                  <button 
                    className="row-action-btn delete"
                    onClick={() => handleDelete(doc.id)}
                    title="Delete File"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Document Content Preview Modal */}
      {selectedDoc && (
        <div className="preview-modal-backdrop anim-fade-in" onClick={() => setSelectedDoc(null)}>
          <div className="preview-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="preview-top">
              <div className="preview-title-wrap">
                <FileCheck size={18} className="text-accent" />
                <div>
                  <h4>{selectedDoc.name}</h4>
                  <span className="preview-sub">{selectedDoc.format} • {selectedDoc.size} • Uploaded {selectedDoc.date}</span>
                </div>
              </div>
              <button className="preview-close-btn" onClick={() => setSelectedDoc(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="preview-body">
              <div className="preview-section">
                <span className="section-tag">SUMMARY</span>
                <p className="summary-text">{selectedDoc.summary}</p>
              </div>

              <div className="preview-section">
                <span className="section-tag">EXTRACTED CONTENT SAMPLE</span>
                <div className="passage-box font-mono">
                  {selectedDoc.previewText}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
