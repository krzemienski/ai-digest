import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("Testing Agent SDK with explicit API key env...");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not set");
    process.exit(1);
  }
  console.log("API key prefix:", apiKey.slice(0, 10));

  try {
    for await (const message of query({
      prompt: "Say hello world in one sentence.",
      options: {
        model: "claude-haiku-4-5-20251001",
        maxTurns: 1,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        settingSources: [],
        persistSession: false,
        tools: [],
        // Pass clean env with only API key to force API key auth
        env: {
          ANTHROPIC_API_KEY: apiKey,
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          NODE_PATH: process.env.NODE_PATH,
        },
        stderr: (data: string) => {
          console.log("[STDERR]:", data.trim());
        },
      },
    })) {
      console.log("Message type:", message.type, "subtype" in message ? (message as Record<string, unknown>).subtype : "");

      if (message.type === "system" && "subtype" in message && (message as Record<string, unknown>).subtype === "init") {
        const init = message as Record<string, unknown>;
        console.log("API key source:", init.apiKeySource);
        console.log("Model:", init.model);
      }

      if (message.type === "result") {
        const result = message as Record<string, unknown>;
        console.log("Success:", result.subtype);
        console.log("Is error:", result.is_error);
        if (result.subtype === "success") {
          console.log("Result text:", (result.result as string)?.slice(0, 200));
        } else {
          console.log("Full result:", JSON.stringify(result, null, 2));
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }

  process.exit(0);
}

main();
