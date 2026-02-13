-- schema.sql - PostgreSQL database schema for Virtual Conference Translator & Summarizer

-- Create database (run this manually or adjust for your setup)
-- CREATE DATABASE virtual_conference;
-- \c virtual_conference;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL for OAuth users
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('viewer', 'moderator', 'host')),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    host_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(10) DEFAULT 'en',
    max_participants INTEGER DEFAULT 100,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'paused')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session participants table
CREATE TABLE IF NOT EXISTS session_participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(50) DEFAULT 'participant' CHECK (role IN ('participant', 'moderator')),
    UNIQUE(session_id, user_id)
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    speaker VARCHAR(255), -- Speaker name or identifier
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence DECIMAL(3,2), -- AI confidence score (0.00-1.00)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Summaries table
CREATE TABLE IF NOT EXISTS summaries (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    summary_type VARCHAR(50) DEFAULT 'rolling' CHECK (summary_type IN ('rolling', 'final', 'key_points')),
    content TEXT NOT NULL,
    key_points JSONB, -- Array of key discussion points
    action_items JSONB, -- Array of action items
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Language preferences table
CREATE TABLE IF NOT EXISTS language_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    input_language VARCHAR(10) DEFAULT 'en',
    output_languages JSONB DEFAULT '["en"]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_host_id ON sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_timestamp ON transcripts(timestamp);
CREATE INDEX IF NOT EXISTS idx_summaries_session_id ON summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_language_preferences_user_id ON language_preferences(user_id);

-- Triggers to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_language_preferences_updated_at BEFORE UPDATE ON language_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional, for testing)
-- INSERT INTO users (name, email, password_hash, role) VALUES
-- ('John Doe', 'john@example.com', '$2a$10$example.hash.here', 'host'),
-- ('Jane Smith', 'jane@example.com', '$2a$10$example.hash.here', 'viewer');

-- INSERT INTO sessions (title, description, host_id, language) VALUES
-- ('Sample Conference', 'A sample virtual conference session', 1, 'en');
