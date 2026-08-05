import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { Bridge } from "./bridge.js";

const server = new Server({
  name: "verse-browser",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
    resources: {},
    prompts: {},
  }
});

const bridge = new Bridge();

// ============================================================================
// TOOLS
// ============================================================================
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "navigate_to",
      description: "Navigate the active browser tab to a specific URL",
      inputSchema: {
        type: "object",
        properties: { url: { type: "string", description: "The URL to navigate to" } },
        required: ["url"]
      }
    },
    {
      name: "search_web",
      description: "Searches the web in a new tab",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string", description: "The search query" } },
        required: ["query"]
      }
    },
    {
      name: "create_tab",
      description: "Creates a new tab",
      inputSchema: {
        type: "object",
        properties: { url: { type: "string", description: "Optional URL to load in the new tab" } },
      }
    },
    {
      name: "close_tab",
      description: "Closes the specified tab",
      inputSchema: {
        type: "object",
        properties: { tabId: { type: "string", description: "The ID of the tab to close" } },
        required: ["tabId"]
      }
    },
    {
      name: "get_page_content",
      description: "Extracts text content from a tab's webpage",
      inputSchema: {
        type: "object",
        properties: { tabId: { type: "string", description: "Optional tab ID. Defaults to active tab if not provided." } },
      }
    },
    {
      name: "take_screenshot",
      description: "Captures a PNG screenshot of the tab",
      inputSchema: {
        type: "object",
        properties: { tabId: { type: "string", description: "Optional tab ID. Defaults to active tab if not provided." } },
      }
    },
    {
      name: "summarize_page",
      description: "Summarizes the content of a page using the Verse AI backend",
      inputSchema: {
        type: "object",
        properties: { tabId: { type: "string", description: "Optional tab ID. Defaults to active tab if not provided." } },
      }
    },
    {
      name: "ai_query",
      description: "Asks the Verse AI a question about the current page via /rag endpoint",
      inputSchema: {
        type: "object",
        properties: { 
          query: { type: "string", description: "The question to ask about the page content" },
          tabId: { type: "string", description: "Optional tab ID. Defaults to active tab if not provided." }
        },
        required: ["query"]
      }
    },
    {
      name: "list_tabs",
      description: "Lists all open tabs across all browser windows",
      inputSchema: {
        type: "object",
        properties: {},
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case "navigate_to": {
        const result = await bridge.request("navigateTo", { url: args.url });
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }
      case "search_web": {
        const url = `https://www.google.com/search?q=${encodeURIComponent(args.query)}`;
        const result = await bridge.request("createTab", { url });
        return { content: [{ type: "text", text: JSON.stringify({ ...result, searchUrl: url }) }] };
      }
      case "create_tab": {
        const result = await bridge.request("createTab", { url: args.url });
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }
      case "close_tab": {
        const result = await bridge.request("closeTab", { tabId: args.tabId });
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }
      case "get_page_content": {
        const result = await bridge.request("getPageContent", { tabId: args.tabId });
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }
      case "take_screenshot": {
        const result = await bridge.request("takeScreenshot", { tabId: args.tabId });
        // Assuming result.image is a base64 string
        return { content: [{ type: "image", data: result.image.replace(/^data:image\/\w+;base64,/, ""), mimeType: "image/png" }] };
      }
      case "summarize_page": {
        // First get the content, then ask AI
        const pageInfo = await bridge.request("getPageContent", { tabId: args.tabId });
        const aiResult = await bridge.request("aiRequest", { 
          endpoint: "/summarize", 
          payload: { text: pageInfo.content, title: pageInfo.title, url: pageInfo.url } 
        });
        return { content: [{ type: "text", text: JSON.stringify({ summary: aiResult.answer }) }] };
      }
      case "ai_query": {
        // First get the content, then ask AI via RAG
        const pageInfo = await bridge.request("getPageContent", { tabId: args.tabId });
        const aiResult = await bridge.request("aiRequest", { 
          endpoint: "/rag", 
          payload: { query: args.query, text: pageInfo.content, title: pageInfo.title, url: pageInfo.url } 
        });
        return { content: [{ type: "text", text: JSON.stringify({ answer: aiResult.answer }) }] };
      }
      case "list_tabs": {
        const result = await bridge.request("getTabs", {});
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return { isError: true, content: [{ type: "text", text: error.message }] };
  }
});

// ============================================================================
// RESOURCES
// ============================================================================
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "verse://tabs",
      name: "Open Tabs",
      mimeType: "application/json",
      description: "List of all open browser tabs"
    },
    {
      uri: "verse://bookmarks",
      name: "Bookmarks",
      mimeType: "application/json",
      description: "User bookmarks"
    },
    {
      uri: "verse://history",
      name: "Browsing History",
      mimeType: "application/json",
      description: "Recent browsing history"
    },
    {
      uri: "verse://active-tab",
      name: "Active Tab Details",
      mimeType: "text/plain",
      description: "Text content and metadata of the currently active tab"
    }
  ]
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  
  try {
    switch (uri) {
      case "verse://tabs": {
        const result = await bridge.request("getTabs", {});
        return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(result) }] };
      }
      case "verse://bookmarks": {
        const result = await bridge.request("getBookmarks", {});
        return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(result) }] };
      }
      case "verse://history": {
        const result = await bridge.request("getHistory", { limit: 100 });
        return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(result) }] };
      }
      case "verse://active-tab": {
        const result = await bridge.request("getActiveTab", {});
        const contentStr = `Title: ${result.title}\nURL: ${result.url}\n\nContent:\n${result.content}`;
        return { contents: [{ uri, mimeType: "text/plain", text: contentStr }] };
      }
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  } catch (error) {
    throw new Error(`Resource read failed: ${error.message}`);
  }
});

// ============================================================================
// PROMPTS
// ============================================================================
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: "summarize-page",
      description: "Prompt to summarize the current active page",
    },
    {
      name: "research-topic",
      description: "Prompt to research a specific topic using the browser",
      arguments: [{ name: "topic", description: "The topic to research", required: true }]
    },
    {
      name: "explain-selection",
      description: "Prompt to explain a selected piece of text",
      arguments: [{ name: "text", description: "The text to explain", required: true }]
    }
  ]
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const name = request.params.name;
  const args = request.params.arguments || {};
  
  switch (name) {
    case "summarize-page":
      return {
        messages: [{ role: "user", content: { type: "text", text: "Please summarize the page I'm currently viewing in Verse Browser. Use the get_page_content tool first to retrieve the active tab's content." } }]
      };
    case "research-topic":
      return {
        messages: [{ role: "user", content: { type: "text", text: `Research '${args.topic}' using the Verse Browser. Search the web, open relevant pages, extract their content, and summarize findings.` } }]
      };
    case "explain-selection":
      return {
        messages: [{ role: "user", content: { type: "text", text: `Explain this text in simple terms: ${args.text}` } }]
      };
    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// ============================================================================
// START SERVER
// ============================================================================
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Verse Browser MCP Server running on stdio");
}

main().catch(console.error);
