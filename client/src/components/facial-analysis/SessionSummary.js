import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SessionSummary = ({ 
  sessionData = null,
  isVisible = false,
  onClose,
  className = ''
}) => {
  if (!isVisible || !sessionData) return null;

  const { metrics, duration, recommendations, detectionRate } = sessionData;

  // Sample trend data - in a real app this would come from stored analysis history
  const trendData = {
    labels: ['Start', '25%', '50%', '75%', 'End'],
    datasets: [
      {
        label: 'Confidence Score',
        data: [65, 72, 78, 75, metrics.confidenceScore],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Eye Contact %',
        data: [55, 62, 68, 70, metrics.eyeContact],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Head Steadiness %',
        data: [70, 75, 80, 78, metrics.headSteadiness],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: false,
        tension: 0.3,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Delivery Metrics Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    },
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Interview Delivery Summary</h2>
            <p className="text-gray-600 mt-1">Analysis of your facial expressions and delivery</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Overall Score */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="text-center">
              <div className={`text-5xl font-bold ${getScoreColor(metrics.confidenceScore)} mb-2`}>
                {Math.round(metrics.confidenceScore)}
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreBadge(metrics.confidenceScore)}`}>
                Overall Confidence Score
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{formatDuration(duration)}</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{Math.round(detectionRate)}%</div>
                  <div className="text-sm text-gray-600">Detection Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{Math.round(100 - metrics.offScreenPercentage)}%</div>
                  <div className="text-sm text-gray-600">On-Screen Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-900">Eye Contact</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{Math.round(metrics.eyeContact)}%</div>
                <div className="text-xs text-blue-700 mt-1">Target: 60-80%</div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-purple-900">Head Steadiness</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">{Math.round(metrics.headSteadiness)}%</div>
                <div className="text-xs text-purple-700 mt-1">Target: 70-90%</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-sm font-medium text-green-900">Blink Rate</span>
                </div>
                <div className="text-2xl font-bold text-green-900">{Math.round(metrics.blinkRate)}/min</div>
                <div className="text-xs text-green-700 mt-1">Target: 15-25/min</div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-yellow-900">Expressions</span>
                </div>
                <div className="text-2xl font-bold text-yellow-900">{Math.round(metrics.smilePercentage)}%</div>
                <div className="text-xs text-yellow-700 mt-1">Positive engagement</div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-indigo-900">Environment</span>
                </div>
                <div className="text-2xl font-bold text-indigo-900">{Math.round(metrics.environmentQuality)}%</div>
                <div className="text-xs text-indigo-700 mt-1">Lighting & clarity</div>
              </div>
            </div>
          </div>

          {/* Trend Chart */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <Line data={trendData} options={chartOptions} />
            </div>
          </div>

          {/* Top Recommendations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 3 Improvement Tips</h3>
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {rec.type.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{rec.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Save Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSummary;