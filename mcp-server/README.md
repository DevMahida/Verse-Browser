# Verse Browser MCP Server

This is the Model Context Protocol (MCP) server for Verse Browser. It allows external AI tools like Claude Desktop to interact with your browser.

## Features

- **9 Tools**: `navigate_to`, `search_web`, `create_tab`, `close_tab`, `get_page_content`, `take_screenshot`, `summarize_page`, `ai_query`, `list_tabs`
- **4 Resources**: Open tabs, bookmarks, history, and active tab content
- **3 Prompts**: Page summarization, topic research, text explanation

## Usage

This server is designed to be spawned by the Verse Browser Electron app automatically via IPC.

To use it in external apps like Claude Desktop, point them to the standalone script or run:
```bash
node mcp-server/server.js
```
*Note: Standalone execution requires Verse Browser to be running to connect to its HTTP bridge fallback.*
