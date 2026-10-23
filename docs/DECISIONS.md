# Decisions Log (docs/DECISIONS.md)

| Decision | Reason |
| :--- | :--- |
| Maintain custom CSS design tokens from `styles.css` while integrating Tailwind utility support | Preserve polished aesthetics, theme consistency, and responsive layouts without breaking existing visual tokens |
| Co-mount API routes at both `/api` and `/api/v1` | Ensures backward compatibility with existing frontend calls while strictly adhering to the `/api/v1` contract in Section 2.10 |
| Implement dual-engine analytics (FastAPI Python primary + TypeScript native fallback) | Provides high-performance Python DAG/CPM algorithms while ensuring zero service interruption if Python is offline |
| Isolate demo seed script to `backend/scripts/seed.demo.ts` with explicit command | Prevents unwanted test data injection on clean boots; guarantees empty database compliance |
| Implement sequential fallback for `ActivityEvent` writes when MongoDB replica set transactions are absent | Allows seamless local standalone MongoDB development while logging any potential sequence inconsistencies |
| Include cryptographically unique `jti: crypto.randomUUID()` in refresh tokens | Guarantees distinct JWT hashes even if token refresh occurs within the same second, preventing false reuse detection |
| Strict Section 2.1 RBAC with last-owner protection | Prevents accidental orphaned projects; restricts project metadata and member role mutation exclusively to Project Owners |
| Gated HTTP 422 task transitions for finish-to-start predecessors & reviews | Prevents broken DAG workflows and enforces quality review gates before marking tasks Done |
| Dual dependency storage (array + TaskDependency compound index) | Provides fast query lookups on tasks while ensuring referential integrity and cycle validation across the project DAG |
