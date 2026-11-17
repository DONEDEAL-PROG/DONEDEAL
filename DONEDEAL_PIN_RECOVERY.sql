CREATE TABLE IF NOT EXISTS dd_pin_profiles (
 id TEXT PRIMARY KEY,device_hash TEXT NOT NULL,encrypted_data TEXT NOT NULL,
 created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS dd_pin_recovery_requests (
 id TEXT PRIMARY KEY,profile_id TEXT NOT NULL REFERENCES dd_pin_profiles(id),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','used')),
 created_at INTEGER NOT NULL,reviewed_at INTEGER,actor_type TEXT,actor_id TEXT,
 verification_method TEXT,verification_note TEXT,code_hash TEXT,expires_at INTEGER,
 attempts INTEGER NOT NULL DEFAULT 0,used_at INTEGER
);
CREATE INDEX IF NOT EXISTS dd_pin_recovery_profile ON dd_pin_recovery_requests(profile_id,created_at);
CREATE UNIQUE INDEX IF NOT EXISTS dd_pin_recovery_one_pending ON dd_pin_recovery_requests(profile_id) WHERE status='pending';
CREATE TABLE IF NOT EXISTS dd_pin_recovery_audit (
 id TEXT PRIMARY KEY,request_id TEXT,profile_id TEXT NOT NULL,actor_type TEXT NOT NULL,
 actor_id TEXT,action TEXT NOT NULL,created_at INTEGER NOT NULL,details TEXT
);
CREATE TRIGGER IF NOT EXISTS dd_pin_recovery_request_audit
AFTER INSERT ON dd_pin_recovery_requests
BEGIN
 INSERT INTO dd_pin_recovery_audit(id,request_id,profile_id,actor_type,actor_id,action,created_at)
 VALUES(lower(hex(randomblob(16))),NEW.id,NEW.profile_id,'customer',NEW.profile_id,'requested',CAST(strftime('%s','now') AS INTEGER));
END;
CREATE TRIGGER IF NOT EXISTS dd_pin_recovery_review_audit
AFTER UPDATE OF status ON dd_pin_recovery_requests WHEN NEW.status<>OLD.status
BEGIN
 INSERT INTO dd_pin_recovery_audit(id,request_id,profile_id,actor_type,actor_id,action,created_at,details)
 VALUES(lower(hex(randomblob(16))),NEW.id,NEW.profile_id,
 CASE WHEN NEW.status='used' THEN 'customer' ELSE NEW.actor_type END,
 CASE WHEN NEW.status='used' THEN NEW.profile_id ELSE NEW.actor_id END,
 CASE WHEN NEW.status='used' THEN 'redeemed' ELSE NEW.status END,
 CAST(strftime('%s','now') AS INTEGER),
 CASE WHEN NEW.status='used' THEN NULL ELSE json_object('method',NEW.verification_method,'note',NEW.verification_note) END);
END;
CREATE TABLE IF NOT EXISTS dd_pin_recovery_rate (
 bucket TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL
);
