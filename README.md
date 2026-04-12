# Organize Tube

A desktop application for organizing YouTube videos with precise loop controls and speed adjustment for practice and study.

## Development

### Database Location

The SQLite database file is stored in the following location on this test machine:

**macOS**: `~/Library/Application Support/com.organizetube.musicpractice/database.db`

For other platforms:
- **Windows**: `%APPDATA%\com.organizetube.musicpractice\database.db`
- **Linux**: `~/.config/com.organizetube.musicpractice/database.db`

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build application
npm run tauri dev
```
