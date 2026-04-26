// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::path::Path;
use std::process::Command;
use std::fs;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn is_mp3_download_enabled() -> bool {
    env::var("DOWNLOAD_MP3").unwrap_or_default() == "true"
}

// Embed the yt-dlp binary at compile time
const YTDLP_BINARY: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/yt-dlp"));

#[tauri::command]
async fn download_youtube_mp3(video_url: String, output_path: String) -> Result<String, String> {
    // Check if feature is enabled
    if !is_mp3_download_enabled() {
        return Err("MP3 download feature is not enabled. Set DOWNLOAD_MP3=true environment variable.".to_string());
    }

    // Check if yt-dlp binary is available (non-empty)
    if YTDLP_BINARY.is_empty() {
        return Err("yt-dlp binary not available. Set DOWNLOAD_MP3=true during build time.".to_string());
    }

    // Parse the output path to extract directory and filename
    let output_path_obj = Path::new(&output_path);
    let output_dir = output_path_obj.parent().unwrap_or(Path::new("./"));
    let filename_pattern = output_path_obj.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("downloaded_audio");

    // Create the full output path with .mp3 extension
    let final_output_path = output_dir.join(format!("{}.mp3", filename_pattern));

    // Create output directory if it doesn't exist
    if let Some(parent) = final_output_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create output directory: {}", e))?;
    }

    // Write yt-dlp binary to temp location
    let temp_dir = env::temp_dir();
    let ytdlp_path = temp_dir.join(if cfg!(windows) { "yt-dlp.exe" } else { "yt-dlp" });

    // Write the embedded binary
    fs::write(&ytdlp_path, YTDLP_BINARY)
        .map_err(|e| format!("Failed to write yt-dlp binary: {}", e))?;

    // Make executable on Unix systems
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&ytdlp_path, fs::Permissions::from_mode(0o755))
            .map_err(|e| format!("Failed to set executable permissions: {}", e))?;
    }

    // Run yt-dlp to download audio (try audio-only first, fallback to extract)
    let output = Command::new(&ytdlp_path)
        .arg("-f")
        .arg("bestaudio[ext=m4a]/bestaudio/best")  // Prefer audio-only formats
        .arg("--js-runtimes")
        .arg("node:deno")  // Prefer Node.js, fallback to deno
        .arg("--no-post-overwrites")  // Skip if file exists
        .arg("-o")
        .arg(&final_output_path.to_str().unwrap().replace(".mp3", ".%(ext)s"))  // Let yt-dlp choose extension
        .arg(&video_url)
        .output()
        .map_err(|e| format!("Failed to execute yt-dlp: {}", e))?;

    // Clean up temporary binary
    let _ = fs::remove_file(&ytdlp_path);

    if output.status.success() {
        Ok(format!("Download completed successfully: {}", final_output_path.display()))
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("yt-dlp error: {}", error_msg))
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(
                    "sqlite:segment_studio.db",
                    vec![
                        tauri_plugin_sql::Migration {
                            version: 1,
                            description: "create_initial_tables",
                            sql: include_str!("../migrations/001_initial.sql"),
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                        tauri_plugin_sql::Migration {
                            version: 2,
                            description: "custom_field_definitions",
                            sql: include_str!("../migrations/002_custom_field_definitions.sql"),
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                    ],
                )
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, is_mp3_download_enabled, download_youtube_mp3])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}