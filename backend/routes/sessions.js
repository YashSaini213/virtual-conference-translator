// routes/sessions.js - Session management routes

const express = require('express');
const { pool } = require('../server');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all sessions for a user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const sessionsQuery = `
      SELECT s.*, u.name as host_name
      FROM sessions s
      JOIN users u ON s.host_id = u.id
      WHERE s.host_id = $1 OR s.id IN (
        SELECT session_id FROM session_participants WHERE user_id = $1
      )
      ORDER BY s.created_at DESC
    `;

    const sessions = await pool.query(sessionsQuery, [userId]);
    res.json(sessions.rows);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new session
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, language, max_participants = 100 } = req.body;
    const hostId = req.user.userId;

    const createSessionQuery = `
      INSERT INTO sessions (title, description, host_id, language, max_participants, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'active', NOW())
      RETURNING *
    `;

    const newSession = await pool.query(createSessionQuery, [
      title, description, hostId, language, max_participants
    ]);

    res.status(201).json(newSession.rows[0]);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.userId;

    // Check if user has access to this session
    const accessQuery = `
      SELECT s.* FROM sessions s
      WHERE s.id = $1 AND (s.host_id = $2 OR s.id IN (
        SELECT session_id FROM session_participants WHERE user_id = $2
      ))
    `;

    const session = await pool.query(accessQuery, [sessionId, userId]);

    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found or access denied' });
    }

    res.json(session.rows[0]);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join a session
router.post('/:id/join', verifyToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.userId;

    // Check if session exists and is active
    const sessionQuery = 'SELECT * FROM sessions WHERE id = $1 AND status = $2';
    const session = await pool.query(sessionQuery, [sessionId, 'active']);

    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found or not active' });
    }

    // Check if user is already a participant
    const participantQuery = 'SELECT * FROM session_participants WHERE session_id = $1 AND user_id = $2';
    const existingParticipant = await pool.query(participantQuery, [sessionId, userId]);

    if (existingParticipant.rows.length > 0) {
      return res.status(400).json({ error: 'Already joined this session' });
    }

    // Add user as participant
    const joinQuery = `
      INSERT INTO session_participants (session_id, user_id, joined_at)
      VALUES ($1, $2, NOW())
    `;

    await pool.query(joinQuery, [sessionId, userId]);

    res.json({ message: 'Successfully joined session' });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave a session
router.post('/:id/leave', verifyToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.userId;

    // Remove user from participants
    const leaveQuery = 'DELETE FROM session_participants WHERE session_id = $1 AND user_id = $2';
    await pool.query(leaveQuery, [sessionId, userId]);

    res.json({ message: 'Successfully left session' });
  } catch (error) {
    console.error('Error leaving session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update session status (host only)
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.userId;
    const { status } = req.body;

    // Check if user is the host
    const hostQuery = 'SELECT host_id FROM sessions WHERE id = $1';
    const hostResult = await pool.query(hostQuery, [sessionId]);

    if (hostResult.rows.length === 0 || hostResult.rows[0].host_id !== userId) {
      return res.status(403).json({ error: 'Only session host can update status' });
    }

    // Update session status
    const updateQuery = 'UPDATE sessions SET status = $1, updated_at = NOW() WHERE id = $2';
    await pool.query(updateQuery, [status, sessionId]);

    res.json({ message: 'Session status updated successfully' });
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session participants
router.get('/:id/participants', verifyToken, async (req, res) => {
  try {
    const sessionId = req.params.id;

    const participantsQuery = `
      SELECT u.id, u.name, u.email, sp.joined_at
      FROM session_participants sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.session_id = $1
      ORDER BY sp.joined_at ASC
    `;

    const participants = await pool.query(participantsQuery, [sessionId]);
    res.json(participants.rows);
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
