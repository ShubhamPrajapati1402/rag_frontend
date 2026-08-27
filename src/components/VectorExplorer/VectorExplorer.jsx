import { useState } from 'react';
import { 
  Binary, 
  Search, 
  Layers, 
  Cpu, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  Database,
  Sliders,
  ChevronRight
} from 'lucide-react';
import './VectorExplorer.css';

export default function VectorExplorer() {
  const [searchQuery, setSearchQuery] = useState('quarterly cloud compute costs and GPU cluster utilization');
  const [copiedId, setCopiedId] = useState(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.85);

  const vectorChunks = [
    {
      id: 'vec_chunk_8801_sec',
      docName: 'Tesla_2025_Annual_Report_10K.pdf',
      pageOrSheet: 'Page 42, Table 4.2',
      cosineScore: 0.948,
      tokens: 184,
      embeddingModel: 'BAAI/bge-m3',
      dimensions: 1024,
      vectorSlice: '[-0.0428, 0.0812, 0.1294, -0.0093, 0.0541, -0.0712, ... +1018 dims]',
      content: `Table 4.2: Total Automotive Revenues for FY2025 reached $96.77B, representing a 14.2% YoY expansion with gross margin on auto deliveries improving to 19.8% after automated gigafactory scaling.`
    },
    {
      id: 'vec_chunk_3312_xls',
      docName: 'Q4_Cloud_Infrastructure_Costs.xlsx',
      pageOrSheet: 'Sheet: Compute_Clusters',
      cosineScore: 0.924,
      tokens: 112,
      embeddingModel: 'BAAI/bge-m3',
      dimensions: 1024,
      vectorSlice: '[0.0124, -0.0631, 0.0984, 0.1421, -0.0211, 0.0833, ... +1018 dims]',
      content: `Sheet Compute_Clusters | Cluster_ID: US-EAST-VA-09 | Monthly_Burn: $41,200 | GPU_Count: 64x H100 | Utilization_Avg: 94.2% | Storage_PgVector_Tier: Supabase Enterprise`
    },
    {
      id: 'vec_chunk_1044_md',
      docName: 'Microservices_Architecture_Specs.md',
      pageOrSheet: 'Section: # Ingestion Pipeline',
      cosineScore: 0.891,
      tokens: 96,
      embeddingModel: 'BAAI/bge-m3',
      dimensions: 1024,
      vectorSlice: '[-0.0841, 0.0342, 0.0519, -0.0194, 0.1102, -0.0491, ... +1018 dims]',
      content: `### Resumability & Idempotency: Ingestion automatically resumes from the exact chunk offset if interrupted by rate limits or server restarts.`
    }
  ];

  const handleCopyVector = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="vector-explorer-container animate-fade-in">
      <div className="explorer-header glass-panel">
        <div className="header-title-wrap">
          <Binary size={22} className="text-brand" />
          <div>
            <h2>PgVector & Semantic Chunk Explorer</h2>
            <p>Inspect raw 1024-dimensional embeddings, cosine distance distributions, and chunk boundaries</p>
          </div>
        </div>

        <div className="vector-stats-row">
          <div className="v-stat glass-inset">
            <span className="v-val text-brand">1024</span>
            <span className="v-lbl">Embed Dim</span>
          </div>
          <div className="v-stat glass-inset">
            <span className="v-val text-emerald">8,412</span>
            <span className="v-lbl">Vectors In DB</span>
          </div>
          <div className="v-stat glass-inset">
            <span className="v-val text-cyan">HNSW</span>
            <span className="v-lbl">Index Method</span>
          </div>
        </div>
      </div>

      {/* Query Vector Distance Tester */}
      <div className="query-tester-card glass-card">
        <div className="tester-header">
          <span className="tester-title">SEMANTIC SIMILARITY VECTOR SEARCH</span>
          <span className="badge badge-brand">Model: BAAI/bge-m3</span>
        </div>

        <div className="search-bar-wrap glass-inset">
          <Search size={16} className="text-muted" />
          <input 
            type="text" 
            placeholder="Type query to compute real-time cosine distance against Supabase PgVector..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="threshold-slider-row">
          <div className="slider-left">
            <span className="slider-lbl">Cosine Similarity Threshold (Top-K Filter):</span>
            <span className="badge badge-emerald font-mono">{(similarityThreshold * 100).toFixed(0)}% Min Match</span>
          </div>
          <input 
            type="range" 
            min="0.5" 
            max="0.99" 
            step="0.01"
            value={similarityThreshold}
            onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
            className="cosine-slider"
          />
        </div>
      </div>

      {/* Vector Results List */}
      <div className="vector-results-list">
        {vectorChunks.map((chunk) => (
          <div key={chunk.id} className="vector-card glass-card">
            <div className="vector-card-header">
              <div className="vector-doc-info">
                <span className="chunk-badge font-mono">{chunk.id}</span>
                <h4 className="v-doc-name">{chunk.docName}</h4>
                <span className="v-doc-loc font-mono">{chunk.pageOrSheet}</span>
              </div>

              <div className="cosine-score-badge">
                <div className="score-progress-bar">
                  <div 
                    className="score-fill" 
                    style={{ width: `${chunk.cosineScore * 100}%` }}
                  ></div>
                </div>
                <span className="score-val font-mono">
                  {(chunk.cosineScore * 100).toFixed(1)}% Cosine Match
                </span>
              </div>
            </div>

            <div className="vector-content-box glass-inset">
              <p className="v-content-text">{chunk.content}</p>
            </div>

            <div className="vector-footer">
              <div className="vector-slice font-mono">
                <span className="slice-label">Raw Embedding Float32:</span>
                <code>{chunk.vectorSlice}</code>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handleCopyVector(chunk.id, chunk.vectorSlice)}
              >
                {copiedId === chunk.id ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                <span>{copiedId === chunk.id ? 'Copied Vector' : 'Copy Embedding'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
