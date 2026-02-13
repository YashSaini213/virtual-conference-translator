// components/CaptionsPanel.js - Real-time captions display component

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const CaptionsPanel = ({ session, socket }) => {
  const [captions, setCaptions] = useState([]);
  const [currentCaption, setCurrentCaption] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const captionsRef = useRef(null);

  useEffect(() => {
    if (socket) {
      socket.on('caption-update', (data) => {
        setCaptions(prev => [...prev, data]);
        setCurrentCaption(data.text);
      });
    }

    fetchExistingCaptions();

    return () => {
      if (socket) {
        socket.off('caption-update');
      }
    };
  }, [socket, session]);

  useEffect(() => {
    if (captionsRef.current) {
      captionsRef.current.scrollTop = captionsRef.current.scrollHeight;
    }
  }, [captions]);

  const fetchExistingCaptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/transcripts/session/${session.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCaptions(response.data);
    } catch (error) {
      console.error('Error fetching captions:', error);
    }
  };

  const startRecording = () => {
    try {
      // Check if Web Speech API is supported
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onstart = () => {
        setIsRecording(true);
        setCurrentCaption('Listening...');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          const caption = {
            text: finalTranscript,
            language: selectedLanguage,
            timestamp: new Date().toISOString(),
            confidence: 0.95
          };
          setCaptions(prev => [...prev, caption]);
          setCurrentCaption(finalTranscript);
        } else if (interimTranscript) {
          setCurrentCaption(interimTranscript + '...');
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setCurrentCaption('Error occurred. Please try again.');
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (currentCaption === 'Listening...') {
          setCurrentCaption('No speech detected.');
        }
      };

      recognition.start();
      window.currentRecognition = recognition;

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not start speech recognition. Please check permissions.');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Stop media stream in real implementation
  };

  const clearCaptions = () => {
    setCaptions([]);
    setCurrentCaption('');
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>

          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
          </select>
        </div>

        <button
          onClick={clearCaptions}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Clear Captions
        </button>
      </div>

      {/* Current Caption Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-800">Live Caption</span>
          <span className="text-xs text-blue-600">
            Language: {selectedLanguage.toUpperCase()}
          </span>
        </div>
        <div className="text-lg text-blue-900 min-h-[3rem] flex items-center">
          {currentCaption || 'Waiting for speech...'}
        </div>
      </div>

      {/* Captions History */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Caption History</h3>
        </div>

        <div
          ref={captionsRef}
          className="max-h-96 overflow-y-auto p-4 space-y-3"
        >
          {captions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No captions yet. Start recording to see live captions.
            </p>
          ) : (
            captions.map((caption, index) => (
              <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900">{caption.text}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">
                        {new Date(caption.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {caption.language?.toUpperCase()}
                      </span>
                      {caption.confidence && (
                        <span className="text-xs text-gray-500">
                          Confidence: {(caption.confidence * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Recording...</span>
        </div>
      )}
    </div>
  );
};

export default CaptionsPanel;
