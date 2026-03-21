---
title: Agent Loop
description: The core agent loop in PRX, covering tool dispatch, streaming, memory recall, and context compaction.
---

# Agent Loop

The agent loop is the central execution cycle that drives every PRX agent session. Each iteration processes an LLM response, dispatches tool calls, manages memory, and decides whether to continue or return a final answer.

## Loop Lifecycle

```
User Message
    │
    ▼
┌─────────────┐
│ Build Context│──── Memory Recall
└──────┬──────┘
       ▼
┌─────────────┐
│ LLM Inference│──── Streaming Response
└──────┬──────┘
       ▼
┌─────────────┐
│ Parse Output │──── Tool Calls / Text
└──────┬──────┘
       ▼
   Tool Calls?
   ├── Yes ──→ Execute Tools ──→ Loop Again
   └── No  ──→ Return Response
```

## Tool Dispatch

When the LLM response contains tool calls, the loop:

1. Validates each tool call against the security policy
2. Executes approved calls (potentially in parallel)
3. Collects results and feeds them back to the LLM
4. Continues the loop for the next inference step

## Streaming

PRX streams LLM responses token-by-token to the client while simultaneously buffering for tool-call detection. The streaming pipeline supports:

- Real-time token forwarding to CLI or WebSocket clients
- Backpressure handling when the client is slow
- Graceful cancellation via Ctrl+C or API signals

## Memory Recall

Before each LLM call, the loop retrieves relevant context from the memory system:

- Recent conversation turns (sliding window)
- Semantic search results from the embedding store
- Pinned facts and user preferences

## Context Compaction

When the conversation exceeds the model's context window, the loop triggers compaction:

1. Summarize older turns into a condensed representation
2. Preserve tool call results that are still referenced
3. Maintain the system prompt and pinned memories intact

## Configuration

```toml
[agent.loop]
max_iterations = 50
parallel_tool_calls = true
compaction_threshold_tokens = 80000
compaction_strategy = "summarize"  # or "truncate"
```

## Related Pages

- [Agent Runtime](./runtime) -- Architecture overview
- [Sub-agents](./subagents) -- Child agent spawning
- [Memory System](/en/prx/memory/) -- Memory backends and recall
