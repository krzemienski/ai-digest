import { query } from "@anthropic-ai/claude-agent-sdk";

async function main() {
  console.log("Starting Agent SDK test...");
  console.log("ANTHROPIC_API_KEY set:", !!process.env.ANTHROPIC_API_KEY);
  console.log("ANTHROPIC_API_KEY prefix:", process.env.ANTHROPIC_API_KEY?.slice(0, 10));

  try {
    const stderrChunks: string[] = [];

    for await (const message of query({
      prompt: "Say hello world",
      options: {
        model: "claude-haiku-4-5-20251001",
        maxTurns: 1,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        settingSources: [],
        persistSession: false,
        tools: [],
        stderr: (data: string) => {
          stderrChunks.push(data);
          console.log("[STDERR]:", data.trim());
        },
      },
    })) {
      console.log("Message type:", message.type, "subtype" in message ? message.subtype : "");
      if (message.type === "result") {
        console.log("Result:", JSON.stringify(message, null, 2));
      }
    }

    if (stderrChunks.length > 0) {
      console.log("\nAll stderr output:");
      console.log(stderrChunks.join(""));
    }
  } catch (error) {
    console.error("Error:", error);
  }

  process.exit(0);
}

main();
