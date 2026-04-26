use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // Run the standard Tauri build process
    tauri_build::build();

    // Download yt-dlp binary if needed
    let target_os = env::var("CARGO_CFG_TARGET_OS").unwrap();
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("yt-dlp");

    // Only download if DOWNLOAD_MP3 feature might be used
    let download_mp3 = env::var("DOWNLOAD_MP3").unwrap_or_default();
    if download_mp3 == "true" {
        download_ytdlp_binary(&target_os, &dest_path);
    } else {
        // Create empty file so the include_bytes! doesn't fail
        fs::write(&dest_path, b"").expect("Failed to create empty yt-dlp file");
    }
}

fn download_ytdlp_binary(target_os: &str, dest_path: &Path) {
    let binary_url = match target_os {
        "windows" => "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe",
        "macos" => "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos",
        "linux" => "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp",
        _ => {
            println!("cargo:warning=Unsupported platform for yt-dlp download: {}", target_os);
            fs::write(dest_path, b"").expect("Failed to create empty yt-dlp file");
            return;
        }
    };

    println!("cargo:rerun-if-env-changed=DOWNLOAD_MP3");
    println!("cargo:warning=Downloading yt-dlp from: {}", binary_url);

    // Use curl to download the binary (available on most systems)
    let output = std::process::Command::new("curl")
        .args(["-L", "-o", dest_path.to_str().unwrap(), binary_url])
        .output();

    match output {
        Ok(result) => {
            if result.status.success() {
                println!("cargo:warning=Successfully downloaded yt-dlp binary");
            } else {
                println!("cargo:warning=Failed to download yt-dlp: {}", String::from_utf8_lossy(&result.stderr));
                // Create empty file so build doesn't fail
                fs::write(dest_path, b"").expect("Failed to create empty yt-dlp file");
            }
        }
        Err(e) => {
            println!("cargo:warning=Failed to execute curl command: {}", e);
            // Create empty file so build doesn't fail
            fs::write(dest_path, b"").expect("Failed to create empty yt-dlp file");
        }
    }
}