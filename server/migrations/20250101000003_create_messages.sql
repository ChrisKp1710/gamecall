-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,

    -- Index per query veloci
    CONSTRAINT messages_content_length CHECK (length(content) > 0 AND length(content) <= 10000)
);

-- Indici per performance
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(receiver_id, read_at) WHERE read_at IS NULL;
