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
  FileCheck
} from 'lucide-react';
import { DocumentItem } from '../../types';
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
  const [uploadProgress, setUploadProgress] = useState<{ name: string; progress: number } | null>(null);

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
    simulateFileUpload('Customer_Satisfaction_Survey_2026.csv', 'CSV', '820 KB');
  };

  const simulateFileUpload = (fileName: string, format: string, size: string) => {
    setUploadProgress({ name: fileName, progress: 20 });

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (!prev) return null;
        if (prev.progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const newDoc: DocumentItem = {
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

  const handleDelete = (id: string) => {
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
          
          <div className="dropzone-actions-bar">
            <button 
              className="btn-browse-file"
              onClick={() => simulateFileUpload('Financial_Model_Q3_Projection.xlsx', 'Excel', '2.4 MB')}
            >
              Browse files
            </button>
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
                          onClick={() => setSelectedDoc(doc)}
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
              <div className="drawer-label">DOCUMENT SUMMARY</div>
              <p className="drawer-summary">{selectedDoc.summary}</p>

              <div className="drawer-label" style={{ marginTop: '20px' }}>EXTRACTED PREVIEW CONTENT</div>
              <div className="preview-text-block">
                {selectedDoc.previewText || 'All structural boundaries extracted and tokenized.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
