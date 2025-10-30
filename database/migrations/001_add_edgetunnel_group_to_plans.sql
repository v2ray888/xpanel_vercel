-- Migration to add edgetunnel_group_id to plans table
ALTER TABLE plans ADD COLUMN edgetunnel_group_id INTEGER REFERENCES edgetunnel_groups(id);