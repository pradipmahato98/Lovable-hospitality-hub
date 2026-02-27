## 2026-02-10 - Sensitive Configuration Exposure via RLS
**Vulnerability:** Broad RLS policies on the `settings` table allowed any staff member to view all settings, including sensitive API keys (`api_keys`) and payment gateway secrets (`payment_gateways`).
**Learning:** In projects using a single key-value `settings` table, a generic "Staff can view" policy creates a significant risk if sensitive integration secrets are stored alongside UI configuration.
**Prevention:** Implement granular RLS policies that explicitly exclude sensitive keys from general staff access, or separate secrets into a dedicated, admin-only table.

## 2026-02-10 - Weak Default Password Policy
**Vulnerability:** The authentication system allowed passwords as short as 6 characters, which is insufficient for enterprise-grade security and vulnerable to brute-force attacks.
**Learning:** Default validation schemas in frontend frameworks often use low minimums for "developer convenience," which can easily leak into production.
**Prevention:** Enforce a minimum of 10 characters for all new user accounts (Sign Up) to prevent account weakness without breaking existing sessions (Sign In), and provide a visual strength indicator.

## 2026-02-10 - Security Monitoring Visibility
**Enhancement:** Added a "Security Breach" tab to the admin console to provide visibility into security-related audit logs and system health.
**Learning:** Security monitoring should be integrated into administrative tools to enable proactive threat detection. Using existing audit logs for security insights reduces "security theater" and provides real value.
**Prevention:** Always provide administrators with clear indicators of system integrity and recent suspicious activities.

## 2026-02-10 - Dynamic Dashboard Data
**Enhancement:** Replaced static dashboard metrics with real-time data from Supabase and added a dynamic security advisory card for administrators.
**Learning:** Hardcoded metrics in a dashboard are not just "incomplete"—they are misleading and can mask actual system issues. Integrating security alerts directly into the main dashboard ensures they aren't missed.
**Prevention:** Use custom hooks to centralize data fetching for metrics and always include a security health check in high-level overviews.

## 2025-05-22 - Insecure Randomness for Sensitive Identifiers
**Vulnerability:** Use of `Math.random()` for generating API keys, reservation codes, and transaction numbers. `Math.random()` is a PRNG and not cryptographically secure, making these identifiers potentially guessable or prone to collisions.
**Learning:** Developers often reach for `Math.random()` for quick ID generation without considering the security implications in finance or authentication contexts.
**Prevention:** Centralize secure random generation using `window.crypto.getRandomValues()` in a utility and mandate its use for any identifier that needs to be unguessable or unique across the system.

## 2026-02-12 - Predictable Identifiers via Date.now()
**Vulnerability:** Use of `Date.now()` for generating transaction numbers, invoice IDs, and payment references. Timestamps are highly predictable and can lead to identifier enumeration or collisions in high-concurrency scenarios.
**Learning:** Developers often substitute `Date.now()` for `Math.random()` thinking it's "unique enough," but it lacks the entropy required for security-sensitive business identifiers.
**Prevention:** Always use cryptographically secure random numeric or alphanumeric strings for identifiers that are exposed to users or used for financial reconciliation. Ensure the same identifier is generated once and reused for linked records (e.g., payment gateway ref and local DB record).

## 2026-02-15 - Hardcoded E2EE Secrets & Broken Decryption
**Vulnerability:** The E2EE module used hardcoded master password and salt in the source code, and guest PII (id_number) was being stored encrypted but displayed in its ciphertext form in the UI. Additionally, some entry points (useAddGuestDocument) bypassed encryption entirely.
**Learning:** Security features like E2EE are only as strong as their key management. Hardcoding keys makes the encryption trivial to bypass. Furthermore, security features must be implemented consistently across all data entry/retrieval paths.
**Prevention:** Always use environment variables for system-wide secrets. Centralize encryption/decryption logic in an API bridge or utility layer and ensure all data hooks automatically handle the transformation to keep the UI clean and secure.

## 2026-02-20 - Path Traversal in Custom Storage Service
**Vulnerability:** The custom backend's storage service used `path.join(STORAGE_ROOT, name)` without validating the `name` parameter, allowing an attacker to create directories outside of the intended storage root via `../` sequences.
**Learning:** When building custom storage or file-handling services, relying solely on `path.join` is insufficient for security. Input sanitization must be combined with absolute path resolution and containment checks.
**Prevention:** Implement strict allow-listing for file/directory names (e.g., alphanumeric only) and use `path.relative` to verify that the resolved path is strictly a sub-directory of the intended root.
