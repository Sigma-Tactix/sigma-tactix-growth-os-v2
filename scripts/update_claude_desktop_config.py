#!/usr/bin/env python3
"""
Update Claude Desktop & Cowork Configuration with the 500 Safe Allowed Sites

This script safely updates:
1. ~/Library/Application Support/Claude-3p/claude_desktop_config.json
2. ~/Library/Application Support/Claude/claude_desktop_config.json (if present)

It creates a backup of the original configuration file before updating 'launchPreviewAllowedOrigins'.
"""

import json
import os
import shutil
import datetime

ALLOWED_SITES_PATH = "/Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/docs/claude-cowork-allowed-sites-500.json"
CONFIG_PATHS = [
    os.path.expanduser("~/Library/Application Support/Claude-3p/claude_desktop_config.json"),
    os.path.expanduser("~/Library/Application Support/Claude/claude_desktop_config.json")
]

def main():
    if not os.path.exists(ALLOWED_SITES_PATH):
        print(f"[ERROR] Allowed sites file not found at: {ALLOWED_SITES_PATH}")
        return

    with open(ALLOWED_SITES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    new_origins = data.get("launchPreviewAllowedOrigins", [])
    print(f"Loaded {len(new_origins)} allowed origins from {ALLOWED_SITES_PATH}")

    updated_any = False
    for config_path in CONFIG_PATHS:
        if not os.path.exists(config_path):
            continue

        print(f"\nProcessing: {config_path}")
        
        # Create backup
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"{config_path}.bak_{timestamp}"
        shutil.copy2(config_path, backup_path)
        print(f"  -> Created backup at: {backup_path}")

        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
        except Exception as e:
            print(f"  [ERROR] Failed to parse {config_path}: {e}")
            continue

        preferences = config.setdefault("preferences", {})
        existing_origins = preferences.get("launchPreviewAllowedOrigins", [])
        
        # Merge preserving order and uniqueness
        merged_set = set(existing_origins)
        merged_list = list(existing_origins)
        for origin in new_origins:
            if origin not in merged_set:
                merged_set.add(origin)
                merged_list.append(origin)

        preferences["launchPreviewAllowedOrigins"] = merged_list
        config["preferences"] = preferences

        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)

        print(f"  -> Successfully updated 'launchPreviewAllowedOrigins' with {len(merged_list)} origins.")
        updated_any = True

    if updated_any:
        print("\n[ALL DONE] Claude Desktop / Cowork config updated. Please restart Claude Desktop if open.")
    else:
        print("\n[INFO] No Claude Desktop config files were found at standard locations.")

if __name__ == "__main__":
    main()
