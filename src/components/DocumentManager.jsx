import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import './DocumentManager.css';

export default function DocumentManager() {
  const [isDragging, setIsDragging] = useState(false);
  const [documents, setDocuments] = useState([
    { id: 1, name: 'annual_report_2026.pdf', status: 'ready', size: '2.4 MB', type: 'PDF' },
    { id: 2, name: 'q3_financials.xlsx', status: 'parsing', size: '1.1 MB', type: 'Excel' }
  ]);

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
    // Simulate adding a file
    const newDoc = {
      id: Date.now(),
      name: 'new_dataset.csv',
      status: 'parsing',
      size: '840 KB',
      type: 'CSV'
    };
    setDocuments([newDoc, ...documents]);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return <CheckCircle className="status-icon ready" size={18} />;
      case 'parsing': return <Clock className="status-icon parsing" size={18} />;
      default: return <AlertCircle className="status-icon error" size={18} />;
    }
  };

  return (
    <div className="doc-manager-container animate-fade-in">
      <div className="doc-header">
        <h2>Data Sources</h2>
        <p>Upload documents (PDF, CSV, Excel, Word) to expand the knowledge base.</p>
      </div>

      <div 
        className={`upload-zone glass-panel ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-icon-wrapper">
          <UploadCloud size={48} className="upload-icon" />
        </div>
        <h3>Drag & Drop files here</h3>
        <p>or click to browse from your computer</p>
        <button className="btn-secondary upload-btn">Browse Files</button>
      </div>

      <div className="doc-list-section">
        <h3>Uploaded Documents</h3>
        <div className="doc-list">
          {documents.map(doc => (
            <div key={doc.id} className="doc-card glass-panel">
              <div className="doc-icon">
                <FileText size={24} />
              </div>
              <div className="doc-info">
                <h4>{doc.name}</h4>
                <div className="doc-meta">
                  <span>{doc.type}</span>
                  <span className="dot">•</span>
                  <span>{doc.size}</span>
                </div>
              </div>
              <div className="doc-status">
                {getStatusIcon(doc.status)}
                <span className={`status-text ${doc.status}`}>
                  {doc.status === 'ready' ? 'Ready' : 'Processing...'}
                </span>
              </div>
            </div>
          ))}

          {/* Skeleton Loaders for visual effect if fetching */}
          <div className="doc-card glass-panel skeleton-card">
            <div className="skeleton-icon skeleton"></div>
            <div className="skeleton-info">
              <div className="skeleton-text skeleton" style={{ width: '60%', height: '16px' }}></div>
              <div className="skeleton-text skeleton" style={{ width: '40%', marginTop: '8px' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
