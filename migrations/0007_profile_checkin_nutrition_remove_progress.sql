ALTER TABLE daily_checkins ADD COLUMN nutrition_notes TEXT;

DROP TABLE body_measurements;
DROP TABLE nutrition_logs;

DELETE FROM agent_audit_log
WHERE entity_type IN ('body_measurement', 'nutrition_log');
