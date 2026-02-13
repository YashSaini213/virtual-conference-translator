

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { UserButton, useAuth } from '@clerk/clerk-react';
import CaptionsPanel from './CaptionsPanel';
import ChatPanel from './ChatPanel';
import SummaryDashboard from './SummaryDashboard';
import LanguageSelector from './LanguageSelector';

const Dashboard = ({ user, onLogout }) => {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('captions');
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    fetchSessions();
    initializeSocket();
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const fetchSessions = async () => {
    // Mock data for demo purposes
    const mockSessions = [
      {
        id: 1,
        title: 'Demo Conference Session',
        description: 'A sample virtual conference session for demonstration.',
        host_name: 'Demo Host',
        status: 'active',
        language: 'en',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Another Session',
        description: 'Another example session.',
        host_name: 'Demo Host',
        status: 'active',
        language: 'es',
        created_at: new Date().toISOString()
      }
    ];
    setSessions(mockSessions);
    setLoading(false);
  };

  const initializeSocket = () => {
    const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('caption-update', (data) => {
      // Handle real-time caption updates
      console.log('Caption update:', data);
    });

    newSocket.on('chat-message', (data) => {
      // Handle real-time chat messages
      console.log('Chat message:', data);
    });

    newSocket.on('summary-update', (data) => {
      // Handle real-time summary updates
      console.log('Summary update:', data);
    });
  };

  const joinSession = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    setCurrentSession(session);

    if (socket) {
      socket.emit('join-session', sessionId);
    }
  };

  const leaveSession = () => {
    if (socket && currentSession) {
      socket.emit('leave-session', currentSession.id);
    }
    setCurrentSession(null);
  };

  const createNewSession = () => {
    const title = prompt('Enter session title:');
    const description = prompt('Enter session description:');

    if (!title) return;

    const newSession = {
      id: Date.now(),
      title,
      description,
      host_name: 'Demo Host',
      status: 'active',
      language: 'en',
      created_at: new Date().toISOString()
    };

    setSessions([...sessions, newSession]);
  };

  const handleStartStopRecording = async () => {
    if (isRecording) {
      // Stop recording and generate final summary
      setIsRecording(false);
      await handleGenerateSummary();
    } else {
      // Start recording
      setIsRecording(true);
    }
  };

  const handleGenerateSummary = async () => {
    try {
      const token = await getToken();
      await axios.post('/api/transcripts/summaries', {
        sessionId: currentSession.id,
        summaryType: 'final'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Optionally refresh summaries or show notification
      alert('Summary generated successfully!');
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Virtual Conference Translator
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.firstName || user?.username || 'User'}</span>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {!currentSession ? (
          /* Session Selection */
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Available Sessions</h2>
                <button
                  onClick={createNewSession}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Create New Session
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900">{session.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Host: {session.host_name}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        session.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <button
                      onClick={() => joinSession(session.id)}
                      className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Join Session
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Active Session View */
          <div className="space-y-6">
            {/* Session Header */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{currentSession.title}</h2>
                    <p className="text-sm text-gray-600">{currentSession.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <LanguageSelector />
                    <button
                      onClick={leaveSession}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Leave Session
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel - Captions */}
              <div className="lg:col-span-2">
                <div className="bg-white shadow rounded-lg">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                      {['captions', 'chat', 'summary'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`py-2 px-4 border-b-2 font-medium text-sm ${
                            activeTab === tab
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-4">
                    {activeTab === 'captions' && <CaptionsPanel session={currentSession} socket={socket} />}
                    {activeTab === 'chat' && <ChatPanel session={currentSession} socket={socket} user={user} />}
                    {activeTab === 'summary' && <SummaryDashboard session={currentSession} />}
                  </div>
                </div>
              </div>

              {/* Right Panel - Controls & Info */}
              <div className="space-y-6">
                {/* Session Info */}
                <div className="bg-white shadow rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Session Info</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Language: {currentSession.language}</p>
                    <p>Status: <span className="capitalize">{currentSession.status}</span></p>
                    <p>Host: {currentSession.host_name}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white shadow rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={handleStartStopRecording}
                      className={`w-full ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                    {isRecording && (
                      <button
                        onClick={handleGenerateSummary}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Generate Summary
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
