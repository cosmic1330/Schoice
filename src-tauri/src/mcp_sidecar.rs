use serde::{Deserialize, Serialize};
use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::PathBuf,
    sync::{Arc, Mutex},
};
use tauri::{App, AppHandle, Manager};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tauri_plugin_shell::{
    process::{CommandChild, CommandEvent},
    ShellExt,
};

const MCP_PORT: &str = "37621";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ApprovalRequest {
    #[allow(dead_code)]
    action: String,
    id: String,
    strategy_name: String,
    strategy_type: String,
    condition_count: usize,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct McpSessionPayload {
    supabase_url: String,
    supabase_anon_key: String,
    supabase_access_token: Option<String>,
}

pub struct McpSidecarState {
    child: Arc<Mutex<Option<CommandChild>>>,
}

impl Drop for McpSidecarState {
    fn drop(&mut self) {
        if let Ok(mut child) = self.child.lock() {
            if let Some(child) = child.take() {
                let _ = child.kill();
            }
        }
    }
}

fn session_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    app_handle
        .path()
        .app_data_dir()
        .map(|path| path.join("mcp-session.json"))
        .map_err(|error| format!("Failed to locate the app data directory: {error}"))
}

#[tauri::command]
pub fn set_mcp_session(
    app_handle: AppHandle,
    session: McpSessionPayload,
) -> Result<(), String> {
    let path = session_path(&app_handle)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Failed to create the app data directory: {error}"))?;
    }
    let contents = serde_json::to_vec(&session)
        .map_err(|error| format!("Failed to serialize the MCP session: {error}"))?;

    let mut options = OpenOptions::new();
    options.create(true).truncate(true).write(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options
        .open(&path)
        .map_err(|error| format!("Failed to open the MCP session file: {error}"))?;
    #[cfg(unix)]
    fs::set_permissions(&path, std::os::unix::fs::PermissionsExt::from_mode(0o600))
        .map_err(|error| format!("Failed to secure the MCP session file: {error}"))?;
    file.write_all(&contents)
        .map_err(|error| format!("Failed to write the MCP session file: {error}"))?;
    file.sync_all()
        .map_err(|error| format!("Failed to save the MCP session file: {error}"))
}

fn handle_approval(
    app_handle: &AppHandle,
    request: ApprovalRequest,
    child: &Arc<Mutex<Option<CommandChild>>>,
) {
    let strategy_type = if request.strategy_type == "bull" {
        "多頭"
    } else {
        "空頭"
    };
    let approved = app_handle
        .dialog()
        .message(format!(
            "AI 要建立{strategy_type}策略「{}」，共 {} 個條件。是否允許？",
            request.strategy_name, request.condition_count
        ))
        .title("允許 MCP 建立策略？")
        .kind(MessageDialogKind::Warning)
        .buttons(MessageDialogButtons::OkCancel)
        .blocking_show();

    let mut response = serde_json::to_vec(&serde_json::json!({
        "type": "approval_response",
        "id": request.id,
        "approved": approved,
    }))
    .expect("approval response is serializable");
    response.push(b'\n');
    if let Ok(mut guard) = child.lock() {
        if let Some(child) = guard.as_mut() {
            if let Err(error) = child.write(&response) {
                log::error!("Failed to answer MCP approval request: {error}");
            }
        }
    }
}

pub fn start(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;
    fs::create_dir_all(&app_data_dir)?;
    let database_path = app_data_dir.join("schoice.db");
    let session_path = app_data_dir.join("mcp-session.json");

    let (mut receiver, command_child) = app
        .shell()
        .sidecar("schoice-mcp")?
        .env("SCHOICE_DATABASE_PATH", &database_path)
        .env("SCHOICE_SESSION_PATH", &session_path)
        .env("SCHOICE_MCP_PORT", MCP_PORT)
        .spawn()?;

    let child = Arc::new(Mutex::new(Some(command_child)));
    app.manage(McpSidecarState {
        child: Arc::clone(&child),
    });

    let app_handle = app.handle().clone();
    tauri::async_runtime::spawn(async move {
        while let Some(event) = receiver.recv().await {
            match event {
                CommandEvent::Stdout(bytes) => {
                    let line = String::from_utf8_lossy(&bytes);
                    let Ok(value) = serde_json::from_str::<serde_json::Value>(&line) else {
                        log::warn!("Ignored invalid MCP sidecar control output");
                        continue;
                    };
                    match value.get("type").and_then(serde_json::Value::as_str) {
                        Some("ready") => log::info!(
                            "Schoice MCP is available at http://127.0.0.1:{MCP_PORT}/mcp"
                        ),
                        Some("approval_request") => {
                            match serde_json::from_value::<ApprovalRequest>(value) {
                                Ok(request) => handle_approval(&app_handle, request, &child),
                                Err(error) => {
                                    log::error!("Invalid MCP approval request: {error}")
                                }
                            }
                        }
                        _ => log::warn!("Ignored unknown MCP sidecar control output"),
                    }
                }
                CommandEvent::Stderr(bytes) => {
                    log::info!("MCP: {}", String::from_utf8_lossy(&bytes));
                }
                CommandEvent::Error(error) => log::error!("MCP sidecar error: {error}"),
                CommandEvent::Terminated(payload) => {
                    log::warn!("MCP sidecar terminated: {:?}", payload.code);
                    if let Ok(mut guard) = child.lock() {
                        guard.take();
                    }
                    break;
                }
                _ => {}
            }
        }
    });

    Ok(())
}

