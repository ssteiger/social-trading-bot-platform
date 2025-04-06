-- Create logs table with auto-incrementing id, timestamp, and message columns
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message TEXT NOT NULL
);

-- Add index on created_at for faster timestamp-based queries
CREATE INDEX logs_created_at_idx ON logs (created_at);
