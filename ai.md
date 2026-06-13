# AI / LLM Developer Roadmap 2025

> Dependency-ordered. Don't skip a stage. Within a stage, go parallel.  
> Each topic has: a Claude prompt to use, the best free resources, and a project.

---

## Stage 1 — The Root (everything depends on this)

### 1. LLMs & Transformers — how it actually works

**Topics:** Attention, tokens, next-token prediction, context windows, temperature, embeddings

**Claude prompt:**
> Explain how LLMs work from first principles for a strong developer — not math-heavy, but mechanically precise. Cover: tokenisation, the transformer block, what attention actually does (intuitively), how next-token prediction works, what temperature and top-p do, what context windows really are, and what embeddings are. End with the 3 biggest misconceptions developers have about LLMs.

**Best free resources:**
- [3Blue1Brown — But what is a GPT?](https://www.youtube.com/watch?v=wjZofJX0v4M) *(YouTube, 27 min)*
- [Jay Alammar — The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) *(visual, free)*
- [Andrej Karpathy — Let's build GPT](https://www.youtube.com/watch?v=kCc8FmEb1nY) *(YouTube, 2hr — do this one)*

**Project:** Build a tiny bigram language model from scratch in Python (~100 lines). Karpathy's video walks you through it. You will never be confused about LLMs again.

---

## Stage 2 — Prompting (depends on Stage 1)

### 2. Prompt Engineering as a System

**Topics:** System prompts, few-shot, chain-of-thought, prompt versioning, injection defence, meta-prompting

**Claude prompt:**
> Explain prompt engineering as a proper engineering discipline, not just tips. Cover: system prompts and how they interact with user turns, few-shot examples and when they help, chain-of-thought and when to force it, how to version and test prompts, what prompt injection is and how to defend against it, what meta-prompting is, and how to write prompts that are robust across edge cases. Give concrete before/after examples.

**Best free resources:**
- [Anthropic Prompt Engineering Docs](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) *(official, concise)*
- [PromptingGuide.ai](https://www.promptingguide.ai/) *(free, well-structured)*

**Project:** Take one real task you do manually (summarise emails, code review, etc). Write 5 prompt versions, test them on 10 inputs, measure which is best. Build a simple eval harness for it.

---

## Stage 3 — Tool Use (depends on Stage 2)

### 3. Tool Use & Function Calling

**Topics:** How LLMs call tools, structured outputs, streaming, multimodal, tool result handling

**Claude prompt:**
> Explain tool use and function calling in LLMs precisely — how does the model decide to call a tool, what does the API request and response look like, how do I handle tool results and pass them back, what are structured outputs and how do I enforce JSON schemas, how does streaming interact with tool calls, and what are common mistakes? Show a concrete working example with a real API.

**Best free resources:**
- [Anthropic Tool Use Docs](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview) *(definitive, free)*
- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling) *(same concept, good examples)*

**Project:** Build an assistant that has 3 tools: `get_weather(city)`, `search_web(query)`, `run_code(python)`. Wire them up to real APIs. Handle multi-tool turns correctly.

---

## Stage 4 — Data + Connectivity (parallel, both depend on Stage 3)

### 4a. RAG — Retrieval Augmented Generation

**Topics:** Embeddings, vector DBs, chunking, hybrid search, reranking

**Claude prompt:**
> Explain RAG from first principles for a developer who understands embeddings conceptually. Cover: why RAG exists (context limits + stale training data), how embeddings encode meaning, what vector DBs do and how ANN search works, chunking strategies and why naive chunking fails, hybrid search (keyword + semantic), reranking, and the eval question — how do I know my RAG is actually working? Point out the 3 most common RAG mistakes.

**Best free resources:**
- [Pinecone — RAG explained](https://www.youtube.com/watch?v=sVcwVQRHIc8) *(YouTube, 15 min)*
- [LlamaIndex Core Concepts](https://docs.llamaindex.ai/en/stable/getting_started/concepts/) *(free docs, well paced)*
- [LangChain RAG conceptual guide](https://python.langchain.com/docs/concepts/rag/) *(free)*

**Project:** Ingest your own codebase or notes into a vector DB. Build a chat interface over it. Then break it deliberately (bad chunks, wrong embeddings) and fix it. That's the real lesson.

---

### 4b. MCP — Model Context Protocol

**Topics:** Standardised tool protocol, writing MCP servers, resources vs tools vs prompts

**Claude prompt:**
> Explain MCP (Model Context Protocol) precisely for a developer who already understands tool use. Cover: what problem MCP solves that raw function calling doesn't, the protocol architecture (client, server, host), the 3 primitives (tools, resources, prompts), transport options (stdio vs SSE), how to write a minimal MCP server in Python or Node, security considerations, and when to use MCP vs just hardcoding tool calls.

**Best free resources:**
- [modelcontextprotocol.io](https://modelcontextprotocol.io/introduction) *(official docs — best starting point)*
- [Fireship — MCP explained in 100 seconds](https://www.youtube.com/watch?v=7j_NE6Pjv-E) *(YouTube)*
- [MCP reference servers on GitHub](https://github.com/modelcontextprotocol/servers) *(read the source)*

**Project:** Write an MCP server that exposes your local filesystem or a private API. Connect it to Claude Desktop or another MCP client. See it used without any code change on the client side — that's the "aha".

---

## Stage 5 — Agents & Orchestration (depend on RAG + MCP + tool use)

### 5a. Agents & Agentic Loops

**Topics:** ReAct, memory types, planning, self-critique, tool selection

**Claude prompt:**
> Explain AI agents precisely for a developer who knows tool use. Cover: what makes something an agent vs a chain, the ReAct (reason + act) loop step by step, the 4 types of memory (in-context, external, episodic, semantic), how planning works (task decomposition), when agents fail and why, how to add self-critique loops, and the key question — when should I use an agent vs a simpler approach?

**Best free resources:**
- [Lilian Weng — LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/) *(the definitive post)*
- [Anthropic Agents Guide](https://docs.anthropic.com/en/docs/build-with-claude/agents) *(practical, free)*

**Project:** Build a research agent that: takes a question, searches the web, reads pages, synthesises, and writes a report. No framework — raw API calls only. Forces you to understand the loop.

---

### 5b. LangGraph & Workflow Orchestration

**Topics:** Nodes, edges, state machine, cycles, human-in-the-loop

**Claude prompt:**
> Explain LangGraph to a developer who has already built a raw agent loop. Cover: what problem LangGraph solves (explicit state, cycles, branching), how a graph differs from a chain, the key primitives (state, nodes, edges, conditional edges), how checkpointing works for human-in-the-loop, when to use LangGraph vs a simpler approach, and what the most common graph design mistakes are.

**Best free resources:**
- [LangGraph official tutorial](https://langchain-ai.github.io/langgraph/tutorials/introduction/) *(best starting point)*
- [LangGraph crash course — FreeCodeCamp](https://www.youtube.com/watch?v=5h-JBkySK34) *(YouTube)*

**Project:** Rebuild your research agent from 5a in LangGraph. Add a human-approval node before it publishes anything. Notice what became easier and harder — that gap is LangGraph's real value.

---

### 5c. Multi-Agent Systems

**Topics:** Orchestrator/worker pattern, agent comms, parallelism, delegation

**Claude prompt:**
> Explain multi-agent systems for a developer who has built single agents. Cover: why multiple agents (specialisation, parallelism, reliability), the orchestrator-worker pattern in detail, how agents communicate (structured messages, shared state, tool calls to other agents), how to handle failures in a multi-agent system, what trust boundaries mean between agents, and when multi-agent is overkill vs genuinely needed.

**Best free resources:**
- [Anthropic — multi-agent frameworks docs](https://docs.anthropic.com/en/docs/build-with-claude/agents#multi-agent-frameworks)
- [Anthropic — Building effective agents](https://www.anthropic.com/research/building-effective-agents) *(research post)*

**Project:** Build a 2-agent system: one agent plans tasks, another executes them. The planner can reject the executor's output and retry. See where coordination overhead kills the benefit.

---

## Stage 6 — Production (parallel, all depend on Stage 5)

### 6a. Evals & Testing

**Topics:** LLM-as-judge, regression suites, automated pipelines, prompt versioning

**Claude prompt:**
> Explain LLM evals as an engineering practice. Cover: why unit tests don't work for LLMs, the 3 eval types (human, automated metric, LLM-as-judge), how to design an eval dataset, what LLM-as-judge looks like in practice and its failure modes, how to catch prompt regressions before deploying, what tools exist (promptfoo, Braintrust, Langfuse evals), and what a minimal but useful eval pipeline looks like for a solo developer.

**Best free resources:**
- [Hamel Husain — Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/) *(essential read)*
- [Promptfoo docs](https://www.promptfoo.dev/docs/intro) *(open source eval tool)*

**Project:** Take your RAG chatbot from 4a. Write 20 test questions with expected answers. Build an LLM-as-judge that scores responses 1–5. Run it before and after a prompt change. See the regression.

---

### 6b. Observability & Tracing

**Topics:** LangSmith, Langfuse, Helicone — traces, cost, latency, failure debugging

**Claude prompt:**
> Explain LLM observability for a developer shipping AI apps. Cover: what a trace is and why it's different from regular logging, what you should instrument in an agent (inputs, tool calls, outputs, latency, token costs), how LangSmith and Langfuse differ, how to debug a broken agent run from a trace, what cost monitoring looks like in practice, and what the minimum viable observability setup looks like for a solo dev project.

**Best free resources:**
- [Langfuse](https://langfuse.com/docs/get-started) *(open source, self-hostable, great docs)*
- [LangSmith docs](https://docs.smith.langchain.com/) *(generous free tier)*

**Project:** Add Langfuse tracing to your agent from stage 5a. Run 20 queries. Find the one with highest cost and longest latency. Understand why. Fix one of them.

---

### 6c. LLM Routing & Gateways

**Topics:** LiteLLM, Portkey — fallbacks, cost routing, caching, rate limits

**Claude prompt:**
> Explain LLM gateways and routing for a developer building production AI apps. Cover: what problem a gateway solves (single provider risk, cost, rate limits), how LiteLLM works as a universal adapter, what model routing strategies exist (cost-based, latency-based, fallback), how semantic caching works and what you actually save, what Portkey adds over LiteLLM, and when you genuinely need this vs when it's overengineering.

**Best free resources:**
- [LiteLLM docs](https://docs.litellm.ai/docs/) *(open source, excellent)*
- [Portkey docs](https://portkey.ai/docs) *(free tier, good observability built-in)*

**Project:** Wrap your app with LiteLLM. Set Claude as primary, GPT-4o as fallback. Add semantic caching. Measure cost difference over 100 queries.

---

## Stage 7 — Advanced (go here when you hit limits, all parallel)

### 7a. Guardrails & Safety

**Topics:** Input/output validation, prompt injection, PII redaction, jailbreaks

**Claude prompt:**
> Explain AI guardrails for production apps to a developer. Cover: the difference between input and output guardrails, what prompt injection actually looks like in an agent with external tools, how to defend against it architecturally, PII detection and redaction approaches, content moderation strategies, what tools exist (Guardrails AI, Llama Guard, NeMo), and what a minimal but serious guardrail stack looks like for a real app.

**Best free resources:**
- [LearnPrompting — prompt injection](https://learnprompting.org/docs/prompt_hacking/injection) *(clear, free)*
- [Guardrails AI docs](https://www.guardrailsai.com/docs) *(open source)*

**Project:** Try to jailbreak your own agent from stage 5a via its tool inputs (indirect injection). Then add a guardrail layer that catches the attack. This will scare you into caring about safety.

---

### 7b. Finetuning

**Topics:** LoRA, QLoRA, PEFT, dataset prep, when to finetune vs prompt

**Claude prompt:**
> Explain finetuning honestly for a developer who has already tried prompting and RAG. Cover: when finetuning is actually the right answer (and when it's not), how LoRA and QLoRA work at the parameter level, what PEFT is, how to prepare a good training dataset, what the training loop looks like, how to evaluate if a finetune improved things, what it costs (GPU hours, money), and what tools/platforms exist to do it without a PhD.

**Best free resources:**
- [Abhishek Thakur — Finetuning LLMs](https://www.youtube.com/watch?v=eC6Hd1hFvos) *(YouTube, practical)*
- [HuggingFace TRL docs](https://huggingface.co/docs/trl/index) *(practical finetuning library)*
- [Modal — Fine-tuning guide](https://modal.com/blog/fine-tuning-llms) *(honest, cost-aware)*

**Project:** Finetune Llama 3.1 8B on a custom dataset using QLoRA on Google Colab (free GPU). Pick a task you've been solving with long system prompts. See if a tiny finetune beats the prompt.

---

### 7c. AI App Architecture

**Topics:** Streaming UX, async patterns, caching, cost management, backend design

**Claude prompt:**
> Explain AI-native app architecture for a developer who builds regular web apps. Cover: why streaming is non-negotiable for LLM UX and how to implement it end-to-end (SSE, WebSockets), async patterns for long-running agent tasks, caching strategies (semantic, exact-match, response caching), how to structure an AI backend (separation of concerns, prompt storage, model abstraction), cost management at scale, and the 3 architectural mistakes most AI apps make.

**Best free resources:**
- [Vercel AI SDK — streaming patterns](https://vercel.com/blog/ai-sdk-3-generative-ui) *(practical)*
- [Anthropic streaming docs](https://docs.anthropic.com/en/docs/build-with-claude/streaming) *(authoritative)*

**Project:** Take any of your previous projects and productionise it: add streaming, a proper async task queue (Celery or similar), response caching, and a cost budget per user. Deploy it.

---

## Dependency Map (quick reference)

```
1. Transformers & LLMs
        ↓
2. Prompt Engineering
        ↓
3. Tool Use & Function Calling
       ↙         ↘
4a. RAG        4b. MCP
       ↘         ↙
   5a. Agents & ReAct
   5b. LangGraph          ← all three in parallel
   5c. Multi-Agent
        ↓
6a. Evals   6b. Observability   6c. Routing   ← all parallel
        ↓
7a. Guardrails   7b. Finetuning   7c. Architecture   ← go when you hit the wall
```

---

## Guiding principles

- **One concept read + one thing built** per topic. Skip the rest.
- **Don't jump to finetuning early.** Most problems are solved by better prompting or RAG.
- **The production layer (stage 6) is not optional.** Skipping evals and tracing means you can't improve what you've built.
- **Inconsistent schedule is fine.** The stages don't expire. A 1-hour day = read half a topic. A 5-hour day = read + build.
- **Build without frameworks first** (especially agents). Raw API calls teach you what frameworks are hiding.