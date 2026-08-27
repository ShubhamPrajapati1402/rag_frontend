import { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Fingerprint, 
  RefreshCw,
  Server
} from 'lucide-react';
import './SecuritySettings.css';

export default function SecuritySettings() {
  const [dbUrl, setDbUrl] = useState('postgresql://postgres:••••••••••••@aws-0-us-east-1.pooler.supabase.com:6543/postgres');
  const [hfToken, setHfToken] = useState('hf_••••••••••••••••••••••••••••••••');
  const [groqKey, setGroqKey] = useState('gsk_••••••••••••••••••••••••••••••••');

  const activeLeases = [
    { fileHash: 'e3b0c442...sec10k', workerId: 'worker-us-east-01', expires: '24s remaining', status: 'LOCKED' },
    { fileHash: '9f86d081...cloud_xl', workerId: 'worker-us-east-02', expires: 'Released (Done)', status: 'FREE' }
  ];

  return (
    <div className="security-settings-container animate-fade-in">
      <div className="security-header glass-panel">
        <div className="header-title-wrap">
          <ShieldCheck size={22} className="text-emerald" />
          <div>
            <h2>Security, Idempotency & Distributed Leasing</h2>
            <p>Enterprise safeguards preventing mixed-vector poisoning and concurrent ingestion race conditions</p>
          </div>
        </div>

        <div className="status-badge badge badge-emerald">
          <CheckCircle2 size={13} />
          <span>Governance: 100% Compliant</span>
        </div>
      </div>

      {/* Security Architecture 3-Grid */}
      <div className="security-cards-grid">
        <div className="sec-card glass-card">
          <div className="sec-card-top">
            <Lock size={18} className="text-brand" />
            <h4>Atomic Distributed Leasing</h4>
          </div>
          <p className="sec-card-desc">
            Time-bound PostgreSQL distributed locks ensure only one ingestion worker processes a specific <code>file_hash</code> at a time.
          </p>
          <div className="sec-status-line">
            <span className="badge badge-emerald">Active Leasing Engine</span>
          </div>
        </div>

        <div className="sec-card glass-card">
          <div className="sec-card-top">
            <Fingerprint size={18} className="text-cyan" />
            <h4>Configuration Hash Shield</h4>
          </div>
          <p className="sec-card-desc">
            Embeddings are stamped with <code>config_hash</code>. If chunk size or embedding model changes, incomplete pipelines abort safely.
          </p>
          <div className="sec-status-line">
            <span className="badge badge-cyan font-mono">Hash: a8f9c2d1</span>
          </div>
        </div>

        <div className="sec-card glass-card">
          <div className="sec-card-top">
            <RefreshCw size={18} className="text-pink" />
            <h4>Resumability Checkpoint</h4>
          </div>
          <p className="sec-card-desc">
            If rate-limited or stopped mid-pipeline, ingestion resumes automatically at the exact un-embedded chunk offset without data duplication.
          </p>
          <div className="sec-status-line">
            <span className="badge badge-emerald">Checkpoint: Zero Duplication</span>
          </div>
        </div>
      </div>

      {/* Active Leases Monitor */}
      <div className="leases-table-card glass-panel">
        <div className="l-table-header">
          <div className="l-header-left">
            <Server size={16} className="text-brand" />
            <h3 className="l-title">DISTRIBUTED LEASE TABLE MONITOR</h3>
          </div>
          <span className="badge badge-muted">PostgreSQL Advisory Locks</span>
        </div>

        <table className="leases-table">
          <thead>
            <tr>
              <th>Target Document Hash</th>
              <th>Assigned Worker</th>
              <th>Lease Expiration</th>
              <th>Lock State</th>
            </tr>
          </thead>
          <tbody>
            {activeLeases.map((l, i) => (
              <tr key={i}>
                <td className="font-mono text-cyan">{l.fileHash}</td>
                <td className="font-mono">{l.workerId}</td>
                <td className="font-mono text-muted">{l.expires}</td>
                <td>
                  <span className={`badge ${l.status === 'LOCKED' ? 'badge-amber' : 'badge-emerald'}`}>
                    {l.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Secret Vault & API Settings */}
      <div className="vault-card glass-panel">
        <div className="vault-header">
          <Key size={16} className="text-brand" />
          <h3 className="vault-title">PRODUCTION CREDENTIAL VAULT (.env)</h3>
        </div>

        <div className="vault-fields">
          <div className="vault-field">
            <label>Supabase PostgreSQL Connection URI (pgvector)</label>
            <input 
              type="text" 
              className="glass-inset font-mono"
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
            />
          </div>

          <div className="vault-field">
            <label>Hugging Face Inference API Token (BAAI/bge-m3)</label>
            <input 
              type="text" 
              className="glass-inset font-mono"
              value={hfToken}
              onChange={(e) => setHfToken(e.target.value)}
            />
          </div>

          <div className="vault-field">
            <label>Groq LLM Acceleration Key (Planned)</label>
            <input 
              type="text" 
              className="glass-inset font-mono"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
