// components/LanguageSelector.js - Language selection component

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LanguageSelector = () => {
  const [preferences, setPreferences] = useState({
    inputLanguage: 'en',
    outputLanguages: ['en']
  });
  const [availableLanguages] = useState([
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'it', name: 'Italian' },
    { code: 'ru', name: 'Russian' }
  ]);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/transcripts/preferences', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreferences(response.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/transcripts/preferences', newPreferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const handleInputLanguageChange = (language) => {
    updatePreferences({
      ...preferences,
      inputLanguage: language
    });
  };

  const handleOutputLanguageToggle = (language) => {
    const newOutputLanguages = preferences.outputLanguages.includes(language)
      ? preferences.outputLanguages.filter(l => l !== language)
      : [...preferences.outputLanguages, language];

    updatePreferences({
      ...preferences,
      outputLanguages: newOutputLanguages
    });
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Input Language */}
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Input:</label>
        <select
          value={preferences.inputLanguage}
          onChange={(e) => handleInputLanguageChange(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        >
          {availableLanguages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Output Languages */}
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Output:</label>
        <div className="flex flex-wrap gap-1">
          {availableLanguages.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleOutputLanguageToggle(lang.code)}
              className={`px-2 py-1 text-xs rounded ${
                preferences.outputLanguages.includes(lang.code)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {lang.code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
