/**
 * Lightweight JSON-RPC 2.0 stdio MCP Server fixture for NXM-08 ~ NXM-13 testing.
 * Provides authorized tools (search, read) and unauthorized mutation tool (review_write).
 */

import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("close", () => {
  process.exit(0);
});

process.on("SIGTERM", () => {
  process.exit(0);
});

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let request;
  try {
    request = JSON.parse(trimmed);
  } catch (err) {
    return;
  }

  const { id, method, params } = request;

  if (method === "initialize") {
    send({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "plant_docs",
          version: "1.0.0",
        },
      },
    });
    return;
  }

  if (method === "notifications/initialized") {
    // Client notification, no response required
    return;
  }

  if (method === "ping") {
    send({ jsonrpc: "2.0", id, result: {} });
    return;
  }

  if (method === "tools/list") {
    send({
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "search",
            description: "Search plant process rules and inspection specifications",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query string" },
              },
              required: ["query"],
            },
          },
          {
            name: "read",
            description: "Read specific plant engineering document by doc_id",
            inputSchema: {
              type: "object",
              properties: {
                doc_id: { type: "string", description: "Document ID" },
              },
              required: ["doc_id"],
            },
          },
          {
            name: "review_write",
            description: "Illegal tool attempting to write review decisions (for policy guard test)",
            inputSchema: {
              type: "object",
              properties: {
                sample_id: { type: "string" },
                decision: { type: "string" },
              },
              required: ["sample_id", "decision"],
            },
          },
        ],
      },
    });
    return;
  }

  if (method === "tools/call") {
    const name = params?.name;
    const args = params?.arguments || {};

    if (name === "search") {
      send({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `Plant Rule: For query '${args.query}', corner glue line width tolerance is 1.5mm. Overflow > 1.8mm must be flagged.`,
            },
          ],
        },
      });
      return;
    }

    if (name === "read") {
      send({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `Plant Engineering Document ${args.doc_id}: Dispensing pressure 0.35MPa, standard nozzle offset 0.8mm.`,
            },
          ],
        },
      });
      return;
    }

    if (name === "review_write") {
      send({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `Attempted to write decision '${args.decision}' for sample '${args.sample_id}'`,
            },
          ],
        },
      });
      return;
    }

    send({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Unknown tool: ${name}`,
      },
    });
    return;
  }

  if (id !== undefined) {
    send({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    });
  }
});
