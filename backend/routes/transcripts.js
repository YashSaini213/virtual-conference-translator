// routes/transcripts.js - Transcript and caption management routes

const express = require('express');
const { pool } = require('../server');
const { verifyToken } = require('../middleware/auth');
const geminiService = require('../services/geminiService');

const router = express.Router();

// Get transcripts for a session
router.get('/session/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    // Check if user has access to this session
    const accessQuery = `
      SELECT s.id FROM sessions s
      WHERE s.id = $1 AND (s.host_id = $2 OR s.id IN (
        SELECT session_id FROM session_participants WHERE user_id = $2
      ))
    `;

    const accessCheck = await pool.query(accessQuery, [sessionId, userId]);
    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    // Get transcripts
    const transcriptsQuery = `
      SELECT * FROM transcripts
      WHERE session_id = $1
      ORDER BY timestamp ASC
    `;

    const transcripts = await pool.query(transcriptsQuery, [sessionId]);
    res.json(transcripts.rows);
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new transcript entry
router.post('/', verifyToken, async (req, res) => {
  try {
    const { sessionId, text, language, speaker, timestamp, confidence } = req.body;
    const userId = req.user.userId;

    // Check if user has access to this session
    const accessQuery = `
      SELECT s.id FROM sessions s
      WHERE s.id = $1 AND (s.host_id = $2 OR s.id IN (
        SELECT session_id FROM session_participants WHERE user_id = $2
      ))
    `;

    const accessCheck = await pool.query(accessQuery, [sessionId, userId]);
    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    // Insert transcript
    const insertQuery = `
      INSERT INTO transcripts (session_id, text, language, speaker, timestamp, confidence, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    const newTranscript = await pool.query(insertQuery, [
      sessionId, text, language, speaker, timestamp, confidence
    ]);

    res.status(201).json(newTranscript.rows[0]);
  } catch (error) {
    console.error('Error adding transcript:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get summaries for a session
router.get('/session/:sessionId/summaries', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    // Check access
    const accessQuery = `
      SELECT s.id FROM sessions s
      WHERE s.id = $1 AND (s.host_id = $2 OR s.id IN (
        SELECT session_id FROM session_participants WHERE user_id = $2
      ))
    `;

    const accessCheck = await pool.query(accessQuery, [sessionId, userId]);
    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    // Get summaries
    const summariesQuery = `
      SELECT * FROM summaries
      WHERE session_id = $1
      ORDER BY created_at DESC
    `;

    const summaries = await pool.query(summariesQuery, [sessionId]);
    res.json(summaries.rows);
  } catch (error) {
    console.error('Error fetching summaries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new summary
router.post('/summaries', verifyToken, async (req, res) => {
  try {
    const { sessionId, summaryType } = req.body;
    const userId = req.user.userId;

    // Check access
    const accessQuery = `
      SELECT s.id FROM sessions s
      WHERE s.id = $1 AND (s.host_id = $2 OR s.id IN (
        SELECT session_id FROM session_participants WHERE user_id = $2
      ))
    `;

    const accessCheck = await pool.query(accessQuery, [sessionId, userId]);
    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this session' });
    }

    // Fetch all transcripts for the session
    const transcriptsQuery = `
      SELECT text FROM transcripts
      WHERE session_id = $1
      ORDER BY timestamp ASC
    `;

    const transcriptsResult = await pool.query(transcriptsQuery, [sessionId]);
    let transcripts = transcriptsResult.rows.map(row => row.text);

    // For demo purposes, if no transcripts exist, use mock data
    if (transcripts.length === 0) {
      transcripts = [
        "Welcome to our virtual conference session. Today we will be discussing the latest advancements in AI technology.",
        "The first topic is machine learning algorithms and their applications in business processes.",
        "Participants are sharing their experiences with implementing AI solutions in various industries.",
        "Key challenges include data quality, integration with existing systems, and ethical considerations.",
        "The discussion is progressing well with good engagement from all attendees."
      ];
    }

    // Generate summary using Gemini
    const summaryData = await geminiService.generateSummary(transcripts, summaryType);

    // Insert summary
    const insertQuery = `
      INSERT INTO summaries (session_id, summary_type, content, key_points, action_items, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    const newSummary = await pool.query(insertQuery, [
      sessionId, summaryType, summaryData.content, JSON.stringify(summaryData.keyPoints), JSON.stringify(summaryData.actionItems)
    ]);

    res.status(201).json(newSummary.rows[0]);
  } catch (error) {
    console.error('Error adding summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get language preferences for a user
router.get('/preferences', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const preferencesQuery = 'SELECT * FROM language_preferences WHERE user_id = $1';
    const preferences = await pool.query(preferencesQuery, [userId]);

    res.json(preferences.rows[0] || { input_language: 'en', output_languages: ['en'] });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update language preferences
router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const { inputLanguage, outputLanguages } = req.body;
    const userId = req.user.userId;

    // Upsert preferences
    const upsertQuery = `
      INSERT INTO language_preferences (user_id, input_language, output_languages, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        input_language = EXCLUDED.input_language,
        output_languages = EXCLUDED.output_languages,
        updated_at = NOW()
      RETURNING *
    `;

    const updatedPreferences = await pool.query(upsertQuery, [
      userId, inputLanguage, JSON.stringify(outputLanguages)
    ]);

    res.json(updatedPreferences.rows[0]);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
