import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

const MCP_API_TOKEN = process.env.MCP_API_TOKEN;

export function createServer(): McpServer {
  const server = new McpServer({
    name: "my-mcp-server",
    version: "1.0.0",
    capabilities: { logging: {} },
  });

  // ============================================================
  // 工具1：存储记忆
  // ============================================================
  server.registerTool(
    "add_memory",
    {
      description: "存储一条记忆，AI会记住这段信息用于未来对话",
      inputSchema: { content: z.string() },
    },
    async ({ content }) => {
      const res = await fetch("https://memos.memtensor.cn/api/openmem/v1/memories", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.MEMOS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: process.env.MEMOS_USER_ID,
          content: content,
        }),
      });
      const data = await res.json();
      return {
        content: [{ type: "text", text: `✅ 已存储记忆：${content}` }],
      };
    }
  );

  // ============================================================
  // 工具2：搜索记忆
  // ============================================================
  server.registerTool(
    "search_memories",
    {
      description: "搜索已存储的记忆",
      inputSchema: { query: z.string() },
    },
    async ({ query }) => {
      const res = await fetch(
        `https://memos.memtensor.cn/api/openmem/v1/memories?user_id=${process.env.MEMOS_USER_ID}&query=${encodeURIComponent(query)}`,
        {
          headers: { "Authorization": `Bearer ${process.env.MEMOS_API_KEY}` },
        }
      );
      const data = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  return server;
}

const RENDER_EXTERNAL_HOSTNAME = process.env.RENDER_EXTERNAL_HOSTNAME;

export const app = createMcpExpressApp({
  host: "0.0.0.0",
  allowedHosts: RENDER_EXTERNAL_HOSTNAME ? [RENDER_EXTERNAL_HOSTNAME] : [],
});