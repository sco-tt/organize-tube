# Organize Tube - YouTube Video Organizer for Practice
# Makefile for build and development commands

.PHONY: help install dev build open clean

# Default target
help:
	@echo "Available targets:"
	@echo "  install     - Install dependencies"
	@echo "  dev         - Start development server"
	@echo "  build       - Build the application for production"
	@echo "  open        - Build and open the application"
	@echo "  clean       - Clean build artifacts"
	@echo "  help        - Show this help message"

# Install dependencies
install:
	npm install

# Start development server
dev:
	npm run tauri dev

# Build frontend only
build-frontend:
	npm run build

# Build the complete Tauri application
build:
	npm run build
	npm run tauri build

# Build and open the application
open: build
	@echo "Opening Organize Tube..."
	@if [ -f "src-tauri/target/release/bundle/macos/Organize Tube.app/Contents/MacOS/Organize Tube" ]; then \
		open "src-tauri/target/release/bundle/macos/Organize Tube.app"; \
	elif [ -f "src-tauri/target/release/organize-tube" ]; then \
		./src-tauri/target/release/organize-tube; \
	else \
		echo "Build not found. Make sure the build completed successfully."; \
		exit 1; \
	fi

# Quick development build and run
dev-open:
	npm run tauri dev

# Clean build artifacts
clean:
	rm -rf dist/
	rm -rf src-tauri/target/
	rm -rf node_modules/

# Full clean and reinstall
reset: clean install