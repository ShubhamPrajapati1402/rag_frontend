import { EvaluationRun, EvaluationCase } from '../types';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const evaluationService = {
  // Delete an evaluation run
  deleteRun: async (runId: number): Promise<{ message: string }> => {
    const res = await fetch(`${BACKEND_BASE_URL}/api/v1/evaluation/runs/${runId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Failed to delete run #${runId}`);
    }

    return res.json();
  },

  // Fetch historical evaluation runs
  getRuns: async (limit = 20): Promise<EvaluationRun[]> => {
    const res = await fetch(`${BACKEND_BASE_URL}/api/v1/evaluation/runs?limit=${limit}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Failed to fetch evaluation runs (${res.status})`);
    }

    return res.json();
  },

  // Fetch detailed metrics and claim-level audits for a single run
  getRunDetails: async (runId: number): Promise<EvaluationRun> => {
    const res = await fetch(`${BACKEND_BASE_URL}/api/v1/evaluation/runs/${runId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Failed to fetch run details for #${runId}`);
    }

    return res.json();
  },

  // Trigger a new dynamic evaluation run
  triggerRun: async (params: {
    title?: string;
    eval_mode?: 'all_documents' | 'single_document';
    document_id?: number | string;
    cases_per_doc?: number;
  }): Promise<{ message: string; run_id?: number }> => {
    const res = await fetch(`${BACKEND_BASE_URL}/api/v1/evaluation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Failed to trigger evaluation run (${res.status})`);
    }

    return res.json();
  }
};
