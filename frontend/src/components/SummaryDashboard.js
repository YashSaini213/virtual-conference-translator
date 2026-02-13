// components/SummaryDashboard.js - Summary and key points display component

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SummaryDashboard = ({ session }) => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSummary, setActiveSummary] = useState('rolling');

  useEffect(() => {
    fetchSummaries();
  }, [session]);

  const fetchSummaries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/transcripts/session/${session.id}/summaries`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummaries(response.data);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      setSummaries([]);
    }
  };

  const generateSummary = async (type) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/transcripts/summaries', {
        sessionId: session.id,
        summaryType: type,
        content: `Generated ${type} summary for session ${session.title}`,
        keyPoints: ["Key point 1", "Key point 2", "Key point 3"],
        actionItems: type === 'final' ? ["Action item 1", "Action item 2"] : []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchSummaries(); // Refresh summaries
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSummary = () => {
    return summaries.find(s => s.summary_type === activeSummary) || null;
  };

  const currentSummary = getCurrentSummary();

  return (
    <div className="space-y-6">
      {/* Summary Controls */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSummary('rolling')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeSummary === 'rolling'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Rolling Summary
          </button>
          <button
            onClick={() => setActiveSummary('key_points')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeSummary === 'key_points'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Key Points
          </button>
          <button
            onClick={() => setActiveSummary('final')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              activeSummary === 'final'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Final Summary
          </button>
        </div>

        <button
          onClick={() => generateSummary(activeSummary)}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          {loading ? 'Generating...' : 'Generate Summary'}
        </button>
      </div>

      {/* Summary Display */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">
            {activeSummary === 'rolling' && 'Rolling Summary'}
            {activeSummary === 'key_points' && 'Key Discussion Points'}
            {activeSummary === 'final' && 'Final Summary'}
          </h3>
        </div>

        <div className="p-4">
          {currentSummary ? (
            <div className="space-y-4">
              {/* Summary Content */}
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700">{currentSummary.content}</p>
              </div>

              {/* Key Points */}
              {currentSummary.key_points && currentSummary.key_points.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Key Points:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {currentSummary.key_points.map((point, index) => (
                      <li key={index} className="text-sm text-gray-700">{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {currentSummary.action_items && currentSummary.action_items.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Action Items:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {currentSummary.action_items.map((item, index) => (
                      <li key={index} className="text-sm text-gray-700">{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metadata */}
              <div className="text-xs text-gray-500 border-t pt-2">
                Generated: {new Date(currentSummary.created_at).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">
                No {activeSummary.replace('_', ' ')} available yet.
                {activeSummary === 'rolling' && ' Start recording to generate live summaries.'}
                {activeSummary === 'key_points' && ' Generate key points from the discussion.'}
                {activeSummary === 'final' && ' Generate a final summary at the end of the session.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary History */}
      {summaries.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Summary History</h3>
          </div>

          <div className="divide-y divide-gray-200">
            {summaries
              .filter(s => s.summary_type === activeSummary)
              .slice(0, 5)
              .map((summary, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {summary.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(summary.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryDashboard;
