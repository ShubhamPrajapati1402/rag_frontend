import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  KeyRound, 
  Cpu, 
  X, 
  Check, 
  RotateCcw,
  Globe
} from 'lucide-react';
import './SimpleModelModal.css';

interface SimpleModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  apiKey: string;
  baseUrl?: string;
  onSave: (modelName: string, apiKey: string, baseUrl?: string) => void;
  onResetToInbuilt: () => void;
}

const PRESET_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Groq)' },
  { id: 'deepseek-chat', label: 'DeepSeek V3' },
  { id: 'mistral-large-latest', label: 'Mistral Large' }
];

export default function SimpleModelModal({
  isOpen,
  onClose,
  selectedModel,
  apiKey,
  baseUrl,
  onSave,
  onResetToInbuilt
}: SimpleModelModalProps) {
  const isInbuilt = !selectedModel || selectedModel === 'inbuilt' || selectedModel === 'gemini-2.5-flash' && !apiKey;

  const [mode, setMode] = useState<'inbuilt' | 'custom'>(isInbuilt ? 'inbuilt' : 'custom');
  const [modelInput, setModelInput] = useState<string>(selectedModel && selectedModel !== 'inbuilt' ? selectedModel : 'gpt-4o');
  const [keyInput, setKeyInput] = useState<string>(apiKey || '');
  const [urlInput, setUrlInput] = useState<string>(baseUrl || '');
  const [showAdvancedUrl, setShowAdvancedUrl] = useState<boolean>(!!baseUrl);

  useEffect(() => {
    if (isOpen) {
      const isCurrentlyInbuilt = !selectedModel || selectedModel === 'inbuilt' || (selectedModel === 'gemini-2.5-flash' && !apiKey);
      setMode(isCurrentlyInbuilt ? 'inbuilt' : 'custom');
      setModelInput(selectedModel && selectedModel !== 'inbuilt' ? selectedModel : 'gpt-4o');
      setKeyInput(apiKey || '');
      setUrlInput(baseUrl || '');
    }
  }, [isOpen, selectedModel, apiKey, baseUrl]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (mode === 'inbuilt') {
      onResetToInbuilt();
    } else {
      const model = modelInput.trim() || 'gpt-4o';
      const key = keyInput.trim();
      const url = urlInput.trim() || undefined;
      onSave(model, key, url);
    }
    onClose();
  };

  const handleReset = () => {
    onResetToInbuilt();
    setMode('inbuilt');
    setKeyInput('');
    setUrlInput('');
    onClose();
  };

  return (
    <div className="simple-model-overlay" onClick={onClose}>
      <div className="simple-model-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="simple-model-header">
          <div className="simple-model-header-left">
            <div className="simple-model-icon">
              <Cpu size={18} />
            </div>
            <div>
              <h2 className="simple-model-title">Select AI Model</h2>
              <p className="simple-model-subtitle">Choose Inbuilt free model or enter your model & API key</p>
            </div>
          </div>
          <button className="simple-model-close" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="simple-model-body">
          {/* Mode Selector Cards */}
          <div className="simple-mode-options">
            <button 
              className={`simple-mode-card ${mode === 'inbuilt' ? 'active' : ''}`}
              onClick={() => setMode('inbuilt')}
              type="button"
            >
              <Sparkles size={16} className="text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="simple-mode-card-title">
                  <span>Inbuilt Model</span>
                  {mode === 'inbuilt' && <Check size={13} className="text-accent" />}
                </div>
                <div className="simple-mode-card-desc">Free server-managed model. No API key required.</div>
              </div>
            </button>

            <button 
              className={`simple-mode-card ${mode === 'custom' ? 'active' : ''}`}
              onClick={() => setMode('custom')}
              type="button"
            >
              <KeyRound size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="simple-mode-card-title">
                  <span>Custom Model</span>
                  {mode === 'custom' && <Check size={13} className="text-accent" />}
                </div>
                <div className="simple-mode-card-desc">Use your own model name & personal API key.</div>
              </div>
            </button>
          </div>

          {/* Custom Model Form */}
          {mode === 'custom' && (
            <div className="simple-custom-section">
              {/* Field 1: Model Name */}
              <div className="simple-field-group">
                <label className="simple-field-label">Model Name</label>
                <div className="simple-input-box">
                  <Cpu size={14} className="text-muted flex-shrink-0" />
                  <input 
                    type="text"
                    className="simple-text-input mono"
                    placeholder="e.g. gpt-4o, claude-3-5-sonnet, deepseek-chat"
                    value={modelInput}
                    onChange={e => setModelInput(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Preset Suggestions */}
                <div className="simple-preset-tags">
                  {PRESET_MODELS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`simple-preset-btn ${modelInput === p.id ? 'active' : ''}`}
                      onClick={() => setModelInput(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: API Key */}
              <div className="simple-field-group">
                <label className="simple-field-label">API Key</label>
                <div className="simple-input-box">
                  <KeyRound size={14} className="text-muted flex-shrink-0" />
                  <input 
                    type="password"
                    className="simple-text-input mono"
                    placeholder="Paste your API Key (e.g. sk-... or gsk_...)"
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Optional: Custom Base URL */}
              <div>
                {!showAdvancedUrl ? (
                  <button 
                    type="button"
                    className="simple-btn-reset" 
                    style={{ fontSize: '11px', padding: '0', color: 'var(--accent-primary)' }}
                    onClick={() => setShowAdvancedUrl(true)}
                  >
                    + Add Custom Base URL (Ollama / LocalAI / OpenRouter)
                  </button>
                ) : (
                  <div className="simple-field-group">
                    <label className="simple-field-label">Custom Base URL (Optional)</label>
                    <div className="simple-input-box">
                      <Globe size={14} className="text-muted flex-shrink-0" />
                      <input 
                        type="text"
                        className="simple-text-input mono"
                        placeholder="e.g. http://localhost:11434/v1"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="simple-model-footer">
          <button type="button" className="simple-btn-reset" onClick={handleReset}>
            <RotateCcw size={12} className="inline mr-1" />
            Reset to Inbuilt
          </button>
          <button type="button" className="simple-btn-apply" onClick={handleApply}>
            <Check size={13} />
            <span>Apply Model</span>
          </button>
        </div>
      </div>
    </div>
  );
}
