# Segment Studio Makefile
APP_NAME = "Segment Studio"
BUILD_DIR = src-tauri/target/release/bundle/macos

.PHONY: all help clean-dev build-prod install-app run-prod deploy

help:
	@echo "Segment Studio Build System"
	@echo "Usage:"
	@echo "  make deploy     - Build and install app"
	@echo "  make all        - Build, install, and launch app"
	@echo "  make build-prod - Build production version"
	@echo "  make install-app - Install to /Applications"
	@echo "  make run-prod   - Launch installed app"

clean-dev:
	@echo "Stopping dev servers..."
	@-pkill -f "tauri dev" 2>/dev/null || true
	@-lsof -ti:1420 | xargs kill -9 2>/dev/null || true

close-app:
	@echo "Closing any running Segment Studio instances..."
	@-pkill -f "Segment Studio" 2>/dev/null || true
	@-osascript -e 'tell application "Segment Studio" to quit' 2>/dev/null || true

build-prod: clean-dev close-app
	@echo "Building production version..."
	npm run build
	npm run tauri build

install-app:
	@echo "Installing to /Applications..."
	@if [ -d "$(BUILD_DIR)/Segment Studio.app" ]; then \
		cp -R "$(BUILD_DIR)/Segment Studio.app" /Applications/; \
		echo "✓ Installed to /Applications"; \
	else \
		echo "✗ Build not found at $(BUILD_DIR)/Segment Studio.app"; \
		ls -la "$(BUILD_DIR)/" || echo "Build directory not found"; \
		exit 1; \
	fi

run-prod:
	@echo "Launching app..."
	@open "/Applications/Segment Studio.app"

deploy: build-prod install-app

all: deploy run-prod