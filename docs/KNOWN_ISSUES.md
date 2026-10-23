# Known Issues & Environmental Considerations (docs/KNOWN_ISSUES.md)

*No unresolved critical issues at present.*

### Environment Notes:
- **MongoDB**: Expects a local MongoDB instance running on `mongodb://127.0.0.1:27017/teampulse_db` or a MongoDB Atlas URI configured via `MONGODB_URI`.
- **Python Virtual Environment**: Python 3.10+ required for FastAPI analytics service in `analytics/`.
- **SMTP**: Email invitation links print to console in development when `SMTP_*` variables are unconfigured.
