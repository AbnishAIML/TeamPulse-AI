# Decisions Log (docs/DECISIONS.md)

| Decision | Reason |
| :--- | :--- |
| Maintain custom CSS design tokens from `styles.css` while integrating Tailwind utility support | Preserve polished aesthetics, theme consistency, and responsive layouts without breaking existing visual tokens |
| Co-mount API routes at both `/api` and `/api/v1` | Ensures backward compatibility with existing frontend calls while strictly adhering to the `/api/v1` contract in Section 2.10 |
| Implement dual-engine analytics (FastAPI Python primary + TypeScript native fallback) | Provides high-performance Python DAG/CPM algorithms while ensuring zero service interruption if Python is offline |
| Isolate demo seed script to `backend/scripts/seed.demo.ts` with explicit command | Prevents unwanted test data injection on clean boots; guarantees empty database compliance |
| Implement sequential fallback for `ActivityEvent` writes when MongoDB replica set transactions are absent | Allows seamless local standalone MongoDB development while logging any potential sequence inconsistencies |
