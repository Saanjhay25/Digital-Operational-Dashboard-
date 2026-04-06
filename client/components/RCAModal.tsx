import React, { useState, useEffect } from 'react';
import { SystemIncident, RCA } from '../types';
import { fetchApi } from '../utils/api';

const api = {
    get: async (url: string) => {
        const res = await fetchApi(url, { method: 'GET' });
        if (!res.ok) throw { response: { status: res.status, data: await res.json().catch(() => ({})) } };
        return { data: await res.json() };
    },
    post: async (url: string, body: any) => {
        const res = await fetchApi(url, { method: 'POST', body: JSON.stringify(body) });
        if (!res.ok) throw { response: { status: res.status, data: await res.json().catch(() => ({})) } };
        return { data: await res.json() };
    },
    put: async (url: string, body: any) => {
        const res = await fetchApi(url, { method: 'PUT', body: JSON.stringify(body) });
        if (!res.ok) throw { response: { status: res.status, data: await res.json().catch(() => ({})) } };
        return { data: await res.json() };
    }
};

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
);
const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);
const SaveIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
);

interface RCAModalProps {
  incident: SystemIncident;
  onClose: () => void;
  onSave: () => void;
  currentUserRole: string;
}

const RCAModal: React.FC<RCAModalProps> = ({ incident, onClose, onSave, currentUserRole }) => {
  const [rca, setRca] = useState<Partial<RCA> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    category: 'Server Issue',
    summary: '',
    detailed_analysis: '',
    preventive_measures: '',
  });

  useEffect(() => {
    fetchRCA();
  }, [incident.id]);

  const fetchRCA = async () => {
    try {
      const res = await api.get(`/rca/incident/${incident.id || incident._id}`);
      if (res.data) {
        setRca(res.data);
        setFormData({
          category: res.data.category,
          summary: res.data.summary,
          detailed_analysis: res.data.detailed_analysis,
          preventive_measures: res.data.preventive_measures,
        });
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError('Failed to fetch RCA data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent, isSubmit: boolean = false) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (rca?.id) {
        // Update existing
        await api.put(`/rca/${rca.id}`, formData);
        if (isSubmit) {
          await api.put(`/rca/${rca.id}/status`, { status: 'Submitted' });
        }
      } else {
        // Create new
        const res = await api.post('/rca', {
          incident_id: incident.id || incident._id,
          ...formData
        });
        if (isSubmit) {
          await api.put(`/rca/${res.data.id}/status`, { status: 'Submitted' });
        }
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save RCA');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveReject = async (status: 'Approved' | 'Draft') => {
    if (!rca?.id) return;
    setSaving(true);
    try {
      await api.put(`/rca/${rca.id}/status`, { status });
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update RCA status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full max-w-2xl">
          <p className="text-gray-300 text-center py-8">Loading RCA Data...</p>
        </div>
      </div>
    );
  }

  const isReadOnly = rca?.status === 'Approved' || rca?.status === 'Submitted';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gray-800/95 backdrop-blur border-b border-gray-700 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Root Cause Analysis
            </h2>
            <p className="text-sm text-gray-400 mt-1">Incident: {incident.title}</p>
          </div>
          <div className="flex items-center gap-4">
            {rca && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1
                ${rca.status === 'Draft' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : 
                  rca.status === 'Submitted' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                  'bg-green-500/10 text-green-400 border-green-500/20'}`}
              >
                {rca.status === 'Approved' ? <CheckCircleIcon className="w-3 h-3" /> : <ClockIcon className="w-3 h-3" />}
                {rca.status}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                disabled={isReadOnly}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              >
                <option value="Server Issue">Server Issue</option>
                <option value="Network Issue">Network Issue</option>
                <option value="Application Bug">Application Bug</option>
                <option value="Human Error">Human Error</option>
                <option value="Third-Party Failure">Third-Party Failure</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Resolution Summary</label>
              <input
                type="text"
                name="summary"
                required
                value={formData.summary}
                onChange={handleInputChange}
                disabled={isReadOnly}
                placeholder="Brief description of how the issue was fixed..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Detailed Root Cause Analysis</label>
              <textarea
                name="detailed_analysis"
                required
                value={formData.detailed_analysis}
                onChange={handleInputChange}
                disabled={isReadOnly}
                rows={5}
                placeholder="Explain the technical sequence of events and why they occurred..."
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Preventive Measures</label>
              <textarea
                name="preventive_measures"
                required
                value={formData.preventive_measures}
                onChange={handleInputChange}
                disabled={isReadOnly}
                rows={3}
                placeholder="What steps will be taken to prevent recurrence?"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                disabled={saving}
              >
                Close
              </button>

              {!isReadOnly && (
                <>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    <SaveIcon className="w-4 h-4" />
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Submit for Approval
                  </button>
                </>
              )}

              {rca?.status === 'Submitted' && currentUserRole === 'admin' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleApproveReject('Draft')}
                    disabled={saving}
                    className="px-6 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    Reject to Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveReject('Approved')}
                    disabled={saving}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50"
                  >
                    Approve RCA
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RCAModal;
