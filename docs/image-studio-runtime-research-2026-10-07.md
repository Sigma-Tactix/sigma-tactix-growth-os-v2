# AI Creative Image Studio Runtime Research

Date: 2026-10-07

## Decision

Use a split runtime:

1. **Gemini Nano Banana** is the immediately available cloud image renderer, using the workspace's existing encrypted Gemini key on the server.
2. **Ollama or LM Studio** may enhance prompts through their local OpenAI-compatible chat endpoints. They are not represented as image renderers.
3. **ComfyUI** is the local image renderer. Growth OS queues a built-in workflow through its local API, discovers an installed checkpoint, polls execution history, and retrieves the generated image bytes.

## Primary-source findings

### Gemini

Google's image-generation guide lists native Gemini image models, supports explicit output aspect ratios, and returns base64 image content. It recommends `gemini-nano-banana-2.1` as the current high-efficiency model and `gemini-3-pro-image` for precision production work.

Source: https://ai.google.dev/gemini-api/docs/image-generation

### Ollama

Ollama's API and vision documentation describe text/chat generation and accepting images as model input. They do not define an image-generation output endpoint. Growth OS therefore uses Ollama only for local prompt rewriting.

Sources:

- https://docs.ollama.com/api/introduction
- https://docs.ollama.com/capabilities/vision

### LM Studio

LM Studio documents a local server with chat, responses, embeddings, and OpenAI-compatible endpoints. It is suitable for prompt enhancement, but its documented server surface is not an image diffusion renderer.

Sources:

- https://lmstudio.ai/docs/developer
- https://lmstudio.ai/docs/developer/openai-compat

### ComfyUI

The official ComfyUI project supports Apple Silicon, reusable JSON workflows, local API integration, asynchronous queueing, model offloading, quantized models, and fully offline operation. Its own API example uses `/prompt`, `/history`, and `/view`, which is the contract implemented by Growth OS.

Sources:

- https://github.com/Comfy-Org/ComfyUI
- https://github.com/Comfy-Org/ComfyUI/blob/master/script_examples/websockets_api_example.py

## Alternatives considered

| Runtime | Strength | Why it is not the default adapter |
|---|---|---|
| Apple Core ML Stable Diffusion | Native Apple Silicon/Core ML inference | More conversion and model-packaging work; the upstream repository warns that maintenance is limited. Useful later for a dedicated native app. |
| LocalAI | Broad OpenAI-compatible local gateway | Heavier operational surface than required for the existing Node app and still needs a separate diffusion backend. |
| stable-diffusion.cpp | Lean native inference options | Attractive for a future single-binary path, but less workflow-flexible than ComfyUI for production creative operations. |

## Runtime truth at implementation time

- Ollama CLI is installed, but its server is not running on port 11434.
- LM Studio CLI is installed, but its server is not running on port 1234.
- No ComfyUI server is running on port 8188.
- The local providers remain labelled **Not running** until their server health checks and model discovery succeed.

No local diffusion model was downloaded automatically because checkpoint choice materially affects disk use, memory use, speed, and output quality.
