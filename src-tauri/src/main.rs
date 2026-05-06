// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod mp3_commands;


// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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
                        tauri_plugin_sql::Migration {
                            version: 3,
                            description: "drop_song_name_column",
                            sql: include_str!("../migrations/003_drop_song_name_column.sql"),
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                        // Migration 4 skipped - tags_json column already exists
                        tauri_plugin_sql::Migration {
                            version: 5,
                            description: "add_mp3_support",
                            sql: include_str!("../migrations/005_add_mp3_support.sql"),
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                        tauri_plugin_sql::Migration {
                            version: 6,
                            description: "simplify_schema_for_mp3",
                            sql: include_str!("../migrations/006_simplify_schema_for_mp3.sql"),
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                    ],
                )
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .register_uri_scheme_protocol("audio", |_app, request| {
            // Extract file path from the URL
            let uri = request.uri();
            let path = uri.path();

            // Remove leading slash and decode URL encoding
            let file_path = urlencoding::decode(&path[1..]).unwrap_or_default();
            let file_path = std::path::Path::new(file_path.as_ref());

            match std::fs::read(file_path) {
                Ok(file_content) => {
                    let mime_type = if file_path.extension().and_then(|s| s.to_str()) == Some("mp3") {
                        "audio/mpeg"
                    } else {
                        "application/octet-stream"
                    };

                    tauri::http::Response::builder()
                        .header("Content-Type", mime_type)
                        .header("Accept-Ranges", "bytes")
                        .body(file_content)
                        .unwrap()
                }
                Err(_) => {
                    tauri::http::Response::builder()
                        .status(404)
                        .body(Vec::new())
                        .unwrap()
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            mp3_commands::upload_single_audio_file,
            mp3_commands::upload_stem_group,
            mp3_commands::get_audio_file_url,
            mp3_commands::delete_audio_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}