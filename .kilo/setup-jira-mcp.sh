#!/usr/bin/env bash
# Setup script for Jira MCP (mcp-atlassian) — macOS / Linux
# Each developer runs this once after cloning the repo.
set -e

JIRA_URL="${1:-https://jira.signaldev.ir}"
JIRA_TOKEN="${2:-}"

if [ -z "$JIRA_TOKEN" ]; then
  echo "Usage: .kilo/setup-jira-mcp.sh <jira_url> <personal_access_token>"
  echo "Get your PAT from: Jira -> Profile -> Personal Access Tokens"
  exit 1
fi

VENV_DIR="$HOME/.local/share/kilo-mcp-venv"

echo "==> Creating venv at $VENV_DIR"
uv venv "$VENV_DIR"

echo "==> Installing mcp-atlassian"
uv pip install --python "$VENV_DIR/bin/python" mcp-atlassian

WRAPPER="$VENV_DIR/start-jira-mcp.sh"
cat > "$WRAPPER" <<EOF
#!/usr/bin/env bash
export JIRA_URL="$JIRA_URL/"
export JIRA_PERSONAL_TOKEN="$JIRA_TOKEN"
export READ_ONLY_MODE=true
exec "$VENV_DIR/bin/mcp-atlassian"
EOF
chmod +x "$WRAPPER"

CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/kilo"
CONFIG_FILE="$CONFIG_DIR/kilo.json"

mkdir -p "$CONFIG_DIR"

echo "==> Writing Jira MCP config to $CONFIG_FILE"
if [ -f "$CONFIG_FILE" ]; then
  TMP=$(mktemp)
  jq --arg wrapper "$WRAPPER" '.mcp.jira = {"type":"local","command":[$wrapper],"timeout":30000}' "$CONFIG_FILE" > "$TMP" && mv "$TMP" "$CONFIG_FILE" 2>/dev/null || {
    echo "Note: Could not merge into existing config. Please add jira MCP manually."
  }
else
  cat > "$CONFIG_FILE" <<EOF
{
  "\$schema": "https://app.kilo.ai/config.json",
  "mcp": {
    "jira": {
      "type": "local",
      "command": ["$WRAPPER"],
      "timeout": 30000
    }
  }
}
EOF
fi

echo ""
echo "Done! Restart Kilo (or open a new session) to load the Jira MCP."
echo "   Verify with: /mcps"
