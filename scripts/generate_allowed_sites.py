import json
import os
from collections import Counter

# Final Curated 500 Safe Allowed Sites for Nazim Khwaja (Sigma Tactix Growth OS)
# Categories (15 total, sum = 500):
# 1. Version Control & Git Ecosystem: 35
# 2. Sigma Tactix & Core Ecosystem: 15
# 3. Frontier AI & LLM Providers: 45
# 4. MCP & Agentic Automation: 35
# 5. Cloud Infrastructure & Hosting: 40
# 6. Web Development & Frontend Frameworks: 40
# 7. Database & Data Engineering: 35
# 8. Performance Marketing & AdTech: 40
# 9. Analytics, Attribution & SEO: 40
# 10. CRO, Landing Pages & Lifecycle: 30
# 11. Creative Design & Multimedia Assets: 30
# 12. Trading, Forex, Fintech & Payments: 35
# 13. B2B Growth, Outbound & CRM: 30
# 14. Security, Privacy & Compliance: 25
# 15. Productivity, Workspaces & Regional Hubs: 25

raw_sites = [
    # ----------------------------------------------------
    # 1. Version Control & Git Ecosystem (35)
    # ----------------------------------------------------
    ("github.com", "GitHub", "Version Control & Git Ecosystem", "Primary Git code repository, collaboration, releases, and CI/CD"),
    ("api.github.com", "GitHub REST API", "Version Control & Git Ecosystem", "Programmatic GitHub repository, release, and issue automation"),
    ("raw.githubusercontent.com", "GitHub Raw Content", "Version Control & Git Ecosystem", "Direct raw file and asset fetching from public repositories"),
    ("gist.github.com", "GitHub Gists", "Version Control & Git Ecosystem", "Code snippet sharing, config distribution, and script hosting"),
    ("objects.githubusercontent.com", "GitHub Storage Objects", "Version Control & Git Ecosystem", "Release artifact, binary, and archive distribution storage"),
    ("assets-cdn.github.com", "GitHub Assets CDN", "Version Control & Git Ecosystem", "Static CDN delivery for GitHub UI, icons, and bundles"),
    ("user-images.githubusercontent.com", "GitHub User Images", "Version Control & Git Ecosystem", "Screenshots, documentation visuals, and issue attachments"),
    ("camo.githubusercontent.com", "GitHub Camo Proxy", "Version Control & Git Ecosystem", "Anonymized SSL proxy for external images in GitHub markdown"),
    ("media.githubusercontent.com", "GitHub LFS Media", "Version Control & Git Ecosystem", "Git Large File Storage (LFS) blob hosting and media downloads"),
    ("avatars.githubusercontent.com", "GitHub Avatars CDN", "Version Control & Git Ecosystem", "User and organization profile avatars across GitHub"),
    ("copilot.github.com", "GitHub Copilot", "Version Control & Git Ecosystem", "AI pair programmer documentation, settings, and telemetry endpoints"),
    ("docs.github.com", "GitHub Docs", "Version Control & Git Ecosystem", "Official documentation for GitHub workflows, Actions, and APIs"),
    ("cli.github.com", "GitHub CLI", "Version Control & Git Ecosystem", "Official gh command-line client documentation and updates"),
    ("ghcr.io", "GitHub Container Registry", "Version Control & Git Ecosystem", "OCI container image registry for Docker and microservice deploys"),
    ("github.blog", "GitHub Engineering Blog", "Version Control & Git Ecosystem", "Product announcements, engineering architecture, and security updates"),
    ("githubstatus.com", "GitHub Status", "Version Control & Git Ecosystem", "Real-time service health, incident status, and uptime monitoring"),
    ("github.community", "GitHub Community Discussions", "Version Control & Git Ecosystem", "Developer forums, issue troubleshooting, and feature requests"),
    ("education.github.com", "GitHub Education", "Version Control & Git Ecosystem", "Developer packs, training resources, and student benefits"),
    ("pages.github.com", "GitHub Pages", "Version Control & Git Ecosystem", "Static site hosting directly from GitHub repositories"),
    ("git-scm.com", "Git SCM", "Version Control & Git Ecosystem", "Official reference manual, release notes, and documentation for Git"),
    ("gitkraken.com", "GitKraken", "Version Control & Git Ecosystem", "Visual Git client documentation, release tracking, and workspaces"),
    ("sourcetreeapp.com", "Sourcetree", "Version Control & Git Ecosystem", "Atlassian Git GUI client documentation and download resources"),
    ("gitlab.com", "GitLab", "Version Control & Git Ecosystem", "Alternative Git repository hosting, CI/CD pipelines, and DevOps docs"),
    ("bitbucket.org", "Bitbucket", "Version Control & Git Ecosystem", "Atlassian Git repository hosting, enterprise pipelines, and docs"),
    ("codeberg.org", "Codeberg", "Version Control & Git Ecosystem", "Open-source Git hosting powered by Forgejo for community software"),
    ("gitea.com", "Gitea", "Version Control & Git Ecosystem", "Lightweight self-hosted Git service documentation and releases"),
    ("forgejo.org", "Forgejo", "Version Control & Git Ecosystem", "Community-driven self-hosted Git platform software and documentation"),
    ("desktop.github.com", "GitHub Desktop", "Version Control & Git Ecosystem", "GitHub Desktop application documentation and release downloads"),
    ("skills.github.com", "GitHub Skills", "Version Control & Git Ecosystem", "Interactive tutorials and hands-on Git & GitHub training courses"),
    ("securitylab.github.com", "GitHub Security Lab", "Version Control & Git Ecosystem", "Security vulnerability research, CodeQL advisories, and bug bounties"),
    ("octoverse.github.com", "GitHub Octoverse", "Version Control & Git Ecosystem", "Annual global software engineering and open-source data reports"),
    ("pkg.github.com", "GitHub Packages Registry", "Version Control & Git Ecosystem", "Package management for npm, maven, rubygems, and nuget packages"),
    ("stars.github.com", "GitHub Stars", "Version Control & Git Ecosystem", "Profiles and technical showcases from top global open-source contributors"),
    ("sponsor.github.com", "GitHub Sponsors", "Version Control & Git Ecosystem", "Funding and sponsorship platform for open-source maintainers"),
    ("enterprise.github.com", "GitHub Enterprise", "Version Control & Git Ecosystem", "Enterprise architecture, SSO/SAML governance, and compliance guides"),

    # ----------------------------------------------------
    # 2. Sigma Tactix, Owned Assets & Core Client Hubs (15)
    # ----------------------------------------------------
    ("sigmatactix.com", "Sigma Tactix Primary Domain", "Sigma Tactix & Core Ecosystem", "Official website and agency landing hub for Sigma Tactix"),
    ("www.sigmatactix.com", "Sigma Tactix Web Platform", "Sigma Tactix & Core Ecosystem", "Public WordPress/Elementor platform and conversion funnel"),
    ("growth-os.sigmatactix.com", "Sigma Tactix Growth OS Subdomain", "Sigma Tactix & Core Ecosystem", "Live deployed Growth OS SaaS application and studio tools"),
    ("api.sigmatactix.com", "Sigma Tactix API Gateway", "Sigma Tactix & Core Ecosystem", "Centralized API endpoints, webhooks, and backend services"),
    ("staging.sigmatactix.com", "Sigma Tactix Staging", "Sigma Tactix & Core Ecosystem", "Pre-production testing environment for Growth OS updates"),
    ("app.sigmatactix.com", "Sigma Tactix App Portal", "Sigma Tactix & Core Ecosystem", "Dedicated customer portal and client reporting dashboard"),
    ("nazimkhwaja.com", "Nazim Khwaja Personal Brand", "Sigma Tactix & Core Ecosystem", "Founder hub, thought leadership, case studies, and newsletter"),
    ("mealsonme.com", "Meals On Me Primary", "Sigma Tactix & Core Ecosystem", "Core client food tech meal-plan delivery platform in Dubai UAE"),
    ("ordermealsonme.com", "Meals On Me Ordering Web App", "Sigma Tactix & Core Ecosystem", "Online customer ordering and subscription funnel for MOM"),
    ("app.mealsonme.com", "Meals On Me App Portal", "Sigma Tactix & Core Ecosystem", "Customer account management, meal selection, and delivery tracking"),
    ("menu.mealsonme.com", "Meals On Me Menu Portal", "Sigma Tactix & Core Ecosystem", "Weekly rotating dietary menu showcase and nutritional calorie info"),
    ("admin.mealsonme.com", "Meals On Me Admin Console", "Sigma Tactix & Core Ecosystem", "Back-office operations, order fulfillment, and metrics"),
    ("paybee.io", "Paybee Fintech", "Sigma Tactix & Core Ecosystem", "Payment orchestration and fintech backend infrastructure"),
    ("quickp2p.io", "QuickP2P", "Sigma Tactix & Core Ecosystem", "Peer-to-peer digital transaction and wallet mobile prototype service"),
    ("couboncode.com", "Couboncode Affiliate Hub", "Sigma Tactix & Core Ecosystem", "Affiliate discount and coupon aggregator venture scaffold"),

    # ----------------------------------------------------
    # 3. Frontier AI Models, Labs, LLM Providers & Inference (45)
    # ----------------------------------------------------
    ("anthropic.com", "Anthropic", "Frontier AI & LLM Providers", "Creator of Claude models, Constitutional AI research, and safety"),
    ("api.anthropic.com", "Anthropic Claude API", "Frontier AI & LLM Providers", "Direct Claude 3.5 Sonnet, Opus, and Haiku inference endpoints"),
    ("claude.ai", "Claude Web & Desktop App", "Frontier AI & LLM Providers", "Claude conversational web workspace, Projects, and Artifacts"),
    ("console.anthropic.com", "Anthropic Console", "Frontier AI & LLM Providers", "API key management, rate limits, billing, and Prompt Workbench"),
    ("openai.com", "OpenAI", "Frontier AI & LLM Providers", "Research organization behind GPT-4o, o1 reasoning models, and Sora"),
    ("platform.openai.com", "OpenAI Developer Platform", "Frontier AI & LLM Providers", "API documentation, playground, usage dashboards, and fine-tuning"),
    ("api.openai.com", "OpenAI API Endpoint", "Frontier AI & LLM Providers", "Programmatic access to GPT-4o, embeddings, audio, and reasoning"),
    ("chatgpt.com", "ChatGPT Web Interface", "Frontier AI & LLM Providers", "Conversational AI workspace, Custom GPTs, and web search"),
    ("deepmind.google", "Google DeepMind", "Frontier AI & LLM Providers", "Frontier AI research, AlphaFold, Gemini foundation architectures"),
    ("ai.google.dev", "Google AI for Developers", "Frontier AI & LLM Providers", "Gemini API documentation, SDKs, quickstarts, and prompt guides"),
    ("aistudio.google.com", "Google AI Studio", "Frontier AI & LLM Providers", "Rapid prototyping, system instructions, and API key management"),
    ("vertexai.google.com", "Google Cloud Vertex AI", "Frontier AI & LLM Providers", "Enterprise generative AI, Model Garden, and agent orchestration"),
    ("mistral.ai", "Mistral AI", "Frontier AI & LLM Providers", "Open-weight and commercial European frontier models (Mistral Large/Pixtral)"),
    ("console.mistral.ai", "Mistral Console", "Frontier AI & LLM Providers", "La Plateforme API key management, codestral, and model endpoints"),
    ("groq.com", "Groq LPU", "Frontier AI & LLM Providers", "Ultra-fast low-latency LPU inference for open models (Llama 3, Mixtral)"),
    ("console.groq.com", "Groq Cloud Console", "Frontier AI & LLM Providers", "API tokens, playground, usage telemetry, and function calling docs"),
    ("together.ai", "Together AI", "Frontier AI & LLM Providers", "Cloud platform for training, fine-tuning, and running open-source models"),
    ("api.together.xyz", "Together AI API", "Frontier AI & LLM Providers", "Inference endpoint for Llama 3, FLUX.1, and Mixtral models"),
    ("perplexity.ai", "Perplexity AI", "Frontier AI & LLM Providers", "Conversational search engine, cited source discovery, and research"),
    ("api.perplexity.ai", "Perplexity Sonar API", "Frontier AI & LLM Providers", "Online live-web search augmented LLM inference endpoints"),
    ("cohere.com", "Cohere", "Frontier AI & LLM Providers", "Enterprise RAG, Command R+ models, and high-accuracy Embed/Rerank"),
    ("dashboard.cohere.com", "Cohere Dashboard", "Frontier AI & LLM Providers", "Enterprise API dashboard, connector playground, and usage metrics"),
    ("x.ai", "xAI", "Frontier AI & LLM Providers", "Grok frontier models, real-time X knowledge, and research"),
    ("api.x.ai", "xAI Grok API", "Frontier AI & LLM Providers", "Programmatic Grok API endpoint for structured outputs and text generation"),
    ("huggingface.co", "Hugging Face Hub", "Frontier AI & LLM Providers", "Open model hub, datasets, Spaces, model weights, and transformers"),
    ("api-inference.huggingface.co", "Hugging Face Inference API", "Frontier AI & LLM Providers", "Serverless inference for open-source AI models and embeddings"),
    ("replicate.com", "Replicate", "Frontier AI & LLM Providers", "Cloud API for running machine learning models with one line of code"),
    ("api.replicate.com", "Replicate API", "Frontier AI & LLM Providers", "REST API for image synthesis, audio cloning, and video rendering"),
    ("ollama.com", "Ollama", "Frontier AI & LLM Providers", "Local LLM runtime for running open-source models on macOS and Linux"),
    ("openwebui.com", "Open WebUI", "Frontier AI & LLM Providers", "Self-hosted web interface for local LLMs, RAG, and multi-user chat"),
    ("openrouter.ai", "OpenRouter", "Frontier AI & LLM Providers", "Unified API gateway routing across 200+ AI models with cost optimization"),
    ("elevenlabs.io", "ElevenLabs", "Frontier AI & LLM Providers", "AI voice synthesis, realistic voice cloning, and audio sound effects"),
    ("api.elevenlabs.io", "ElevenLabs API", "Frontier AI & LLM Providers", "Programmatic text-to-speech, voice generation, and audio streaming"),
    ("runwayml.com", "Runway Gen-2 & Gen-3", "Frontier AI & LLM Providers", "Generative video synthesis, motion brush, and AI video editing tools"),
    ("pika.art", "Pika Labs", "Frontier AI & LLM Providers", "AI video generator platform for commercial animation and social assets"),
    ("midjourney.com", "Midjourney", "Frontier AI & LLM Providers", "Photorealistic AI image generation, prompt showcases, and web alpha"),
    ("stability.ai", "Stability AI", "Frontier AI & LLM Providers", "Stable Diffusion image generation, Stable Audio, and video models"),
    ("blackforestlabs.ai", "Black Forest Labs", "Frontier AI & LLM Providers", "Creators of FLUX.1 state-of-the-art visual foundation models"),
    ("heygen.com", "HeyGen AI Avatars", "Frontier AI & LLM Providers", "Generative AI video avatars for personalized B2B outreach and tutorials"),
    ("api.heygen.com", "HeyGen Video API", "Frontier AI & LLM Providers", "Programmatic video rendering and automated avatar generation"),
    ("suno.com", "Suno AI", "Frontier AI & LLM Providers", "Generative AI music and commercial audio creation platform"),
    ("deepgram.com", "Deepgram", "Frontier AI & LLM Providers", "Automated speech recognition (Nova-2), audio transcription, and TTS"),
    ("fireworks.ai", "Fireworks AI", "Frontier AI & LLM Providers", "Production-grade inference platform for open multimodal and text models"),
    ("fal.ai", "fal.ai Generative Media", "Frontier AI & LLM Providers", "Lightning-fast inference engine for diffusion models and visual AI"),
    ("deepseek.com", "DeepSeek AI", "Frontier AI & LLM Providers", "Cost-effective open-weights coding and mathematical reasoning models"),

    # ----------------------------------------------------
    # 4. MCP, Agentic Frameworks, RAG & Workflow Automation (35)
    # ----------------------------------------------------
    ("modelcontextprotocol.io", "Model Context Protocol (MCP)", "MCP & Agentic Automation", "Official specification and documentation for MCP servers and tools"),
    ("smithery.ai", "Smithery MCP Registry", "MCP & Agentic Automation", "Discovery marketplace and auto-install hub for MCP servers"),
    ("mcp.so", "MCP.so Directory", "MCP & Agentic Automation", "Community directory and curation portal for MCP integrations"),
    ("pulse.mcp.run", "MCP Pulse Monitor", "MCP & Agentic Automation", "Uptime and compatibility testing for public MCP servers"),
    ("langchain.com", "LangChain", "MCP & Agentic Automation", "Building context-aware LLM applications and multi-step agent chains"),
    ("docs.langchain.com", "LangChain Documentation", "MCP & Agentic Automation", "Reference guides, component architecture, and integration docs"),
    ("langsmith.com", "LangSmith", "MCP & Agentic Automation", "LLM evaluation, observability, debugging, and production trace tracking"),
    ("langfuse.com", "Langfuse", "MCP & Agentic Automation", "Open-source LLM engineering platform for observability, metrics, and evals"),
    ("composio.dev", "Composio", "MCP & Agentic Automation", "Production tooling connecting AI agents to 200+ external SaaS apps"),
    ("microsoft.github.io", "Microsoft Semantic Kernel & AutoGen", "MCP & Agentic Automation", "Multi-agent conversational orchestration and enterprise SDKs"),
    ("crewai.com", "CrewAI", "MCP & Agentic Automation", "Framework for orchestrating role-playing autonomous AI agent teams"),
    ("docs.crewai.com", "CrewAI Docs", "MCP & Agentic Automation", "Official guides for configuring crews, tools, agents, and tasks"),
    ("llamaindex.ai", "LlamaIndex", "MCP & Agentic Automation", "Data framework for connecting private business data to LLMs and RAG"),
    ("flowiseai.com", "Flowise AI", "MCP & Agentic Automation", "Open-source UI visual builder for LangChain and LlamaIndex agents"),
    ("dify.ai", "Dify.AI", "MCP & Agentic Automation", "Visual LLM application development platform with orchestration & RAG"),
    ("n8n.io", "n8n Workflow Automation", "MCP & Agentic Automation", "Self-hosted node-based workflow automation tool integrating AI nodes"),
    ("docs.n8n.io", "n8n Documentation", "MCP & Agentic Automation", "Node references, self-hosting deployment guides, and webhook tutorials"),
    ("zapier.com", "Zapier", "MCP & Agentic Automation", "Cloud integration platform connecting SaaS tools with automated Zaps"),
    ("make.com", "Make (Integromat)", "MCP & Agentic Automation", "Visual workflow builder for complex multi-step data transformations"),
    ("activepieces.com", "Activepieces", "MCP & Agentic Automation", "Open-source alternative to Zapier for AI and enterprise workflows"),
    ("relay.app", "Relay.app", "MCP & Agentic Automation", "Automated workflows combining human-in-the-loop approvals with AI"),
    ("pipedream.com", "Pipedream", "MCP & Agentic Automation", "Developer-first integration platform with serverless code and webhooks"),
    ("trigger.dev", "Trigger.dev", "MCP & Agentic Automation", "Background jobs framework for Next.js and Node with zero timeouts"),
    ("inngest.com", "Inngest", "MCP & Agentic Automation", "Event-driven durable workflows and background job orchestration"),
    ("temporal.io", "Temporal", "MCP & Agentic Automation", "Microservice orchestration platform ensuring bulletproof reliability"),
    ("modal.com", "Modal Labs", "MCP & Agentic Automation", "Serverless cloud compute for running AI models, Python containers, and GPUs"),
    ("beam.cloud", "Beam Cloud", "MCP & Agentic Automation", "Serverless GPU platform for running inference and background AI pipelines"),
    ("braintrustdata.com", "Braintrust", "MCP & Agentic Automation", "Enterprise AI eval and prompt management platform for product teams"),
    ("arize.com", "Arize AI", "MCP & Agentic Automation", "AI observability and model monitoring platform for drift and hallucinations"),
    ("trulens.org", "TruLens", "MCP & Agentic Automation", "Open-source library for evaluating and tracking LLM app quality and RAG"),
    ("helicone.ai", "Helicone", "MCP & Agentic Automation", "Open-source LLM observability, caching, cost monitoring, and rate limiting"),
    ("agentops.ai", "AgentOps", "MCP & Agentic Automation", "Observability and testing platform built specifically for AI agent fleets"),
    ("superagi.com", "SuperAGI", "MCP & Agentic Automation", "Open-source infrastructure to build, manage, and run autonomous agents"),
    ("agentgpt.reworkd.ai", "AgentGPT", "MCP & Agentic Automation", "Autonomous AI agents executing iterative web tasks in the browser"),
    ("auto-gpt.ai", "AutoGPT", "MCP & Agentic Automation", "Community ecosystem for autonomous AI goal-oriented agent execution"),

    # ----------------------------------------------------
    # 5. Cloud Infrastructure, Hosting, Edge & Serverless (40)
    # ----------------------------------------------------
    ("cloud.google.com", "Google Cloud Platform", "Cloud Infrastructure & Hosting", "Enterprise cloud computing services, Vertex AI, compute, and IAM"),
    ("console.cloud.google.com", "Google Cloud Console", "Cloud Infrastructure & Hosting", "Web management console for GCP services, billing, and APIs"),
    ("storage.googleapis.com", "Google Cloud Storage", "Cloud Infrastructure & Hosting", "Object storage service for data pipelines, backups, and media assets"),
    ("aws.amazon.com", "Amazon Web Services", "Cloud Infrastructure & Hosting", "Cloud infrastructure platform spanning compute, S3, RDS, and Bedrock"),
    ("console.aws.amazon.com", "AWS Management Console", "Cloud Infrastructure & Hosting", "Administrative web console for AWS instances and cloud services"),
    ("portal.azure.com", "Microsoft Azure Portal", "Cloud Infrastructure & Hosting", "Microsoft cloud platform, Azure OpenAI service, and infrastructure"),
    ("cloudflare.com", "Cloudflare", "Cloud Infrastructure & Hosting", "Global CDN, DNS, DDoS mitigation, and edge compute infrastructure"),
    ("dash.cloudflare.com", "Cloudflare Dashboard", "Cloud Infrastructure & Hosting", "DNS management, SSL/TLS, Zero Trust, and Cloudflare Workers"),
    ("workers.dev", "Cloudflare Workers", "Cloud Infrastructure & Hosting", "Serverless edge computing execution domain for worker scripts"),
    ("hostinger.com", "Hostinger Global", "Cloud Infrastructure & Hosting", "Web hosting provider hosting Sigma Tactix domains and platforms"),
    ("hpanel.hostinger.com", "Hostinger hPanel", "Cloud Infrastructure & Hosting", "Server management, file manager, databases, and SSL controls"),
    ("supabase.com", "Supabase", "Cloud Infrastructure & Hosting", "Open-source Firebase alternative: Postgres, Auth, Realtime, Storage"),
    ("app.supabase.com", "Supabase Dashboard", "Cloud Infrastructure & Hosting", "Database schema editor, RLS policy manager, and SQL console"),
    ("supabase.co", "Supabase API Services", "Cloud Infrastructure & Hosting", "Hosted Supabase client API, OAuth endpoints, and database pooling"),
    ("vercel.com", "Vercel", "Cloud Infrastructure & Hosting", "Frontend deployment platform for Next.js, preview URLs, and analytics"),
    ("vercel.app", "Vercel App Previews", "Cloud Infrastructure & Hosting", "Live staging preview and edge deployment URL domain for Vercel"),
    ("netlify.com", "Netlify", "Cloud Infrastructure & Hosting", "Composable web platform for modern frontend builds and serverless functions"),
    ("netlify.app", "Netlify App Previews", "Cloud Infrastructure & Hosting", "Hosted application and continuous preview domain for Netlify"),
    ("railway.app", "Railway", "Cloud Infrastructure & Hosting", "Modern cloud platform to provision databases, web services, and backends"),
    ("render.com", "Render", "Cloud Infrastructure & Hosting", "Unified cloud to build and run apps, static sites, Postgres, and cron jobs"),
    ("fly.io", "Fly.io", "Cloud Infrastructure & Hosting", "Global app platform running Docker containers close to users worldwide"),
    ("digitalocean.com", "DigitalOcean", "Cloud Infrastructure & Hosting", "Developer cloud hosting: Droplets, Managed Databases, and App Platform"),
    ("hetzner.com", "Hetzner Online", "Cloud Infrastructure & Hosting", "Cost-effective dedicated and cloud server hosting in Europe"),
    ("vultr.com", "Vultr", "Cloud Infrastructure & Hosting", "High-performance cloud compute, bare metal, and GPU instances"),
    ("docker.com", "Docker", "Cloud Infrastructure & Hosting", "Containerization platform for building, sharing, and running applications"),
    ("hub.docker.com", "Docker Hub", "Cloud Infrastructure & Hosting", "Official public registry for Docker container images and templates"),
    ("kubernetes.io", "Kubernetes", "Cloud Infrastructure & Hosting", "Open-source container orchestration engine for automated scaling"),
    ("ngrok.com", "ngrok", "Cloud Infrastructure & Hosting", "Secure introspectable tunnels to localhost for webhook development"),
    ("tailscale.com", "Tailscale", "Cloud Infrastructure & Hosting", "Zero-config mesh VPN based on WireGuard for secure private networks"),
    ("zerotier.com", "ZeroTier", "Cloud Infrastructure & Hosting", "Global area networking software connecting team devices securely"),
    ("hashicorp.com", "HashiCorp", "Cloud Infrastructure & Hosting", "Enterprise multi-cloud automation software suite and documentation"),
    ("terraform.io", "Terraform", "Cloud Infrastructure & Hosting", "Infrastructure as Code tool for automating cloud resource deployments"),
    ("pulumi.com", "Pulumi", "Cloud Infrastructure & Hosting", "Infrastructure as Code using standard TypeScript, Python, and Go"),
    ("sst.dev", "SST (Serverless Stack)", "Cloud Infrastructure & Hosting", "Full-stack framework for building serverless apps on AWS and Cloudflare"),
    ("serverless.com", "Serverless Framework", "Cloud Infrastructure & Hosting", "CLI framework for deploying functions and microservices across clouds"),
    ("upstash.com", "Upstash", "Cloud Infrastructure & Hosting", "Serverless Redis, Kafka, and QStash with per-request pricing"),
    ("neon.tech", "Neon Serverless Postgres", "Cloud Infrastructure & Hosting", "Serverless Postgres with autoscaling, branching, and bottomless storage"),
    ("planetscale.com", "PlanetScale", "Cloud Infrastructure & Hosting", "MySQL-compatible serverless database platform built on Vitess"),
    ("turso.tech", "Turso", "Cloud Infrastructure & Hosting", "Edge-hosted distributed database powered by libSQL (SQLite fork)"),
    ("backblaze.com", "Backblaze B2", "Cloud Infrastructure & Hosting", "Cost-effective S3-compatible cloud object storage for backups and media"),

    # ----------------------------------------------------
    # 6. Web Development, Frontend, Frameworks & Tooling (40)
    # ----------------------------------------------------
    ("react.dev", "React", "Web Development & Frontend Frameworks", "Official documentation and interactive guides for React 19"),
    ("vite.dev", "Vite", "Web Development & Frontend Frameworks", "Next generation frontend build tool and local development server"),
    ("nextjs.org", "Next.js", "Web Development & Frontend Frameworks", "React framework for full-stack web applications, App Router, and SSR"),
    ("typescriptlang.org", "TypeScript", "Web Development & Frontend Frameworks", "Typed JavaScript documentation, playground, and tsconfig references"),
    ("tailwindcss.com", "Tailwind CSS", "Web Development & Frontend Frameworks", "Utility-first CSS framework documentation and component templates"),
    ("nodejs.org", "Node.js", "Web Development & Frontend Frameworks", "JavaScript runtime built on Chrome's V8 engine, official docs and LTS"),
    ("npmjs.com", "npm Registry", "Web Development & Frontend Frameworks", "Package manager registry for JavaScript packages and node modules"),
    ("pnpm.io", "pnpm", "Web Development & Frontend Frameworks", "Fast, disk space efficient package manager using content-addressable storage"),
    ("yarnpkg.com", "Yarn", "Web Development & Frontend Frameworks", "JavaScript dependency management tool and workspaces reference"),
    ("bun.sh", "Bun", "Web Development & Frontend Frameworks", "All-in-one JavaScript runtime, bundler, test runner, and package manager"),
    ("deno.land", "Deno", "Web Development & Frontend Frameworks", "Modern runtime for JavaScript and TypeScript with secure defaults"),
    ("vuejs.org", "Vue.js", "Web Development & Frontend Frameworks", "Progressive JavaScript framework documentation, reactivity, and SFCs"),
    ("svelte.dev", "Svelte", "Web Development & Frontend Frameworks", "Cybernetically enhanced web apps compile-time framework and SvelteKit"),
    ("angular.dev", "Angular", "Web Development & Frontend Frameworks", "Modern Angular framework documentation, signals, and CLI guides"),
    ("astro.build", "Astro", "Web Development & Frontend Frameworks", "Web framework for content-driven websites with Islands architecture"),
    ("remix.run", "Remix", "Web Development & Frontend Frameworks", "Full-stack web framework focused on web standards and modern UX"),
    ("nuxt.com", "Nuxt", "Web Development & Frontend Frameworks", "Intuitive Vue framework for server-side rendering and static generation"),
    ("developer.mozilla.org", "MDN Web Docs", "Web Development & Frontend Frameworks", "Authoritative documentation for HTML, CSS, JavaScript, and Web APIs"),
    ("w3.org", "World Wide Web Consortium (W3C)", "Web Development & Frontend Frameworks", "Web standards body for HTML5, WCAG accessibility, and protocols"),
    ("caniuse.com", "Can I Use", "Web Development & Frontend Frameworks", "Browser support tables for modern HTML5, CSS3, and JavaScript features"),
    ("web.dev", "Google web.dev", "Web Development & Frontend Frameworks", "Guidance on Core Web Vitals, progressive web apps, and performance"),
    ("css-tricks.com", "CSS-Tricks", "Web Development & Frontend Frameworks", "In-depth tutorials, CSS flexbox/grid guides, and frontend techniques"),
    ("smashingmagazine.com", "Smashing Magazine", "Web Development & Frontend Frameworks", "Editorial publications on UI design, UX strategy, and web coding"),
    ("esbuild.github.io", "esbuild", "Web Development & Frontend Frameworks", "Extremely fast JavaScript bundler written in Go, powering modern tools"),
    ("swc.rs", "SWC", "Web Development & Frontend Frameworks", "Rust-based platform for the next generation of fast developer tools"),
    ("vitest.dev", "Vitest", "Web Development & Frontend Frameworks", "Blazing fast unit test framework powered by Vite, compatible with Jest"),
    ("jestjs.io", "Jest", "Web Development & Frontend Frameworks", "Delightful JavaScript testing framework with focus on simplicity"),
    ("playwright.dev", "Playwright", "Web Development & Frontend Frameworks", "Reliable end-to-end testing for modern web apps across all browsers"),
    ("puppeteer.dev", "Puppeteer", "Web Development & Frontend Frameworks", "Node.js library providing high-level API to control Chrome headless"),
    ("cypress.io", "Cypress", "Web Development & Frontend Frameworks", "Next-gen front-end testing tool built for the modern web"),
    ("jsdelivr.com", "jsDelivr", "Web Development & Frontend Frameworks", "Free, fast, and reliable Open Source CDN for npm and GitHub packages"),
    ("cdn.jsdelivr.net", "jsDelivr CDN Network", "Web Development & Frontend Frameworks", "Direct file asset delivery host for libraries, scripts, and fonts"),
    ("unpkg.com", "unpkg", "Web Development & Frontend Frameworks", "Fast, global content delivery network for everything on npm"),
    ("cdnjs.com", "cdnjs", "Web Development & Frontend Frameworks", "Community CDN service for popular open-source web libraries"),
    ("fontawesome.com", "Font Awesome", "Web Development & Frontend Frameworks", "Icon library and toolkit used across web applications and dashboards"),
    ("fonts.google.com", "Google Fonts", "Web Development & Frontend Frameworks", "Extensive library of open-source font families and variable fonts"),
    ("lucide.dev", "Lucide Icons", "Web Development & Frontend Frameworks", "Beautiful and consistent open-source icon suite for modern interfaces"),
    ("heroicons.com", "Heroicons", "Web Development & Frontend Frameworks", "Hand-crafted SVG icons made by the makers of Tailwind CSS"),
    ("simpleicons.org", "Simple Icons", "Web Development & Frontend Frameworks", "Free SVG brand icons for popular technology and software logos"),
    ("shadcn.com", "shadcn/ui", "Web Development & Frontend Frameworks", "Accessible, customizable UI components built with Radix and Tailwind"),

    # ----------------------------------------------------
    # 7. Database, Vector Search, Data Engineering & Storage (35)
    # ----------------------------------------------------
    ("postgresql.org", "PostgreSQL", "Database & Data Engineering", "World's most advanced open-source relational database system"),
    ("redis.io", "Redis", "Database & Data Engineering", "In-memory data structure store used as a database, cache, and message broker"),
    ("sqlite.org", "SQLite", "Database & Data Engineering", "Self-contained, serverless, zero-configuration SQL database engine"),
    ("mysql.com", "MySQL", "Database & Data Engineering", "Widely deployed open-source relational database management system"),
    ("mongodb.com", "MongoDB", "Database & Data Engineering", "Document-oriented NoSQL database designed for modern applications"),
    ("mariadb.org", "MariaDB", "Database & Data Engineering", "Community-developed fork of MySQL relational database management system"),
    ("pinecone.io", "Pinecone", "Database & Data Engineering", "Managed, cloud-native vector database for semantic search and AI RAG"),
    ("qdrant.tech", "Qdrant", "Database & Data Engineering", "Vector search engine and vector database with extended filtering support"),
    ("trychroma.com", "ChromaDB", "Database & Data Engineering", "AI-native open-source embedding database for powering LLM apps"),
    ("weaviate.io", "Weaviate", "Database & Data Engineering", "Open-source AI-first vector search engine with hybrid search support"),
    ("milvus.io", "Milvus", "Database & Data Engineering", "Cloud-native open-source vector database built for massive scale AI"),
    ("prisma.io", "Prisma ORM", "Database & Data Engineering", "Next-generation ORM for Node.js and TypeScript with auto-migrations"),
    ("orm.drizzle.team", "Drizzle ORM", "Database & Data Engineering", "TypeScript ORM that is lightweight, performant, and type-safe"),
    ("typeorm.io", "TypeORM", "Database & Data Engineering", "ORM that runs in NodeJS, Browser, and mobile platforms with TypeScript"),
    ("sequelize.org", "Sequelize", "Database & Data Engineering", "Promise-based Node.js ORM for Postgres, MySQL, MariaDB, SQLite"),
    ("knexjs.org", "Knex.js", "Database & Data Engineering", "SQL query builder for PostgreSQL, CockroachDB, MSSQL, MySQL, and SQLite"),
    ("snowflake.com", "Snowflake", "Database & Data Engineering", "Cloud data warehouse and analytics data cloud platform"),
    ("clickhouse.com", "ClickHouse", "Database & Data Engineering", "Blazing fast open-source columnar database for real-time analytics"),
    ("databricks.com", "Databricks", "Database & Data Engineering", "Unified data analytics, Lakehouse architecture, and Apache Spark platform"),
    ("getdbt.com", "dbt (data build tool)", "Database & Data Engineering", "Data transformation tool enabling data analysts to engineer pipelines in SQL"),
    ("dataform.co", "Dataform", "Database & Data Engineering", "Scalable data modeling and transformation in Google Cloud BigQuery"),
    ("apache.org", "Apache Software Foundation", "Database & Data Engineering", "Open-source software projects including Spark, Kafka, Airflow, and Flink"),
    ("spark.apache.org", "Apache Spark", "Database & Data Engineering", "Unified analytics engine for large-scale data processing and machine learning"),
    ("kafka.apache.org", "Apache Kafka", "Database & Data Engineering", "Distributed event streaming platform for high-throughput data pipelines"),
    ("airflow.apache.org", "Apache Airflow", "Database & Data Engineering", "Platform to programmatically author, schedule, and monitor workflows"),
    ("duckdb.org", "DuckDB", "Database & Data Engineering", "In-process SQL OLAP database management system for fast local analytics"),
    ("meilisearch.com", "Meilisearch", "Database & Data Engineering", "Lightning-fast, ultra-relevant, typo-tolerant search engine API"),
    ("typesense.org", "Typesense", "Database & Data Engineering", "Fast, open-source typo-tolerant search engine alternative to Algolia"),
    ("algolia.com", "Algolia", "Database & Data Engineering", "Hosted search and discovery API powering search bars for leading e-commerce"),
    ("elastic.co", "Elasticsearch & Kibana", "Database & Data Engineering", "Search, observability, and security platform built on Lucene"),
    ("pgvector.org", "pgvector", "Database & Data Engineering", "Open-source vector similarity search extension for PostgreSQL"),
    ("fauna.com", "Fauna", "Database & Data Engineering", "Document-relational database with strong consistency and serverless delivery"),
    ("couchdb.apache.org", "Apache CouchDB", "Database & Data Engineering", "Database that embraces the web with JSON documents and sync protocols"),
    ("min.io", "MinIO", "Database & Data Engineering", "High-performance S3-compatible enterprise object storage for AI workloads"),
    ("questdb.io", "QuestDB", "Database & Data Engineering", "High-performance time-series database with SQL support and fast ingestion"),

    # ----------------------------------------------------
    # 8. Performance Marketing, Paid Ads & AdTech Platforms (40)
    # ----------------------------------------------------
    ("ads.google.com", "Google Ads", "Performance Marketing & AdTech", "Paid search, display, Performance Max, and YouTube video advertising"),
    ("marketingplatform.google.com", "Google Marketing Platform", "Performance Marketing & AdTech", "Enterprise advertising and analytics suite (DV360, SA360, Campaign Manager)"),
    ("merchants.google.com", "Google Merchant Center", "Performance Marketing & AdTech", "E-commerce product feed management for Google Shopping campaigns"),
    ("business.facebook.com", "Meta Business Suite", "Performance Marketing & AdTech", "Centralized management of Meta ad accounts, pages, and pixels"),
    ("adsmanager.facebook.com", "Meta Ads Manager", "Performance Marketing & AdTech", "Campaign creation, auction bidding, and attribution for FB & Instagram"),
    ("linkedin.com", "LinkedIn", "Performance Marketing & AdTech", "Professional networking, B2B lead generation, and social distribution"),
    ("campaign.linkedin.com", "LinkedIn Campaign Manager", "Performance Marketing & AdTech", "B2B targeted advertising, matched audiences, and Sponsored Content"),
    ("ads.tiktok.com", "TikTok Ads Manager", "Performance Marketing & AdTech", "Short-form video advertising, Sparks ads, and creative center"),
    ("ads.twitter.com", "X (Twitter) Ads", "Performance Marketing & AdTech", "Promoted posts, follower campaigns, and conversion tracking on X"),
    ("ads.snapchat.com", "Snap Ads Manager", "Performance Marketing & AdTech", "Augmented reality filters, Story Ads, and commercial campaigns on Snapchat"),
    ("ads.pinterest.com", "Pinterest Ads", "Performance Marketing & AdTech", "Visual discovery advertising, Promoted Pins, and shopping catalogs"),
    ("advertising.amazon.com", "Amazon Advertising", "Performance Marketing & AdTech", "Sponsored Products, Brands, and Amazon DSP for retail media"),
    ("ads.microsoft.com", "Microsoft Advertising", "Performance Marketing & AdTech", "Bing search ads, Microsoft Audience Network, and Copilot placements"),
    ("taboola.com", "Taboola", "Performance Marketing & AdTech", "Native advertising and content discovery network across premium publishers"),
    ("outbrain.com", "Outbrain", "Performance Marketing & AdTech", "Native advertising feed delivering sponsored articles and engagement"),
    ("criteo.com", "Criteo", "Performance Marketing & AdTech", "Commerce media platform providing programmatic retargeting and display ads"),
    ("appsflyer.com", "AppsFlyer", "Performance Marketing & AdTech", "Mobile app attribution, deep linking, fraud prevention, and analytics"),
    ("adjust.com", "Adjust", "Performance Marketing & AdTech", "Mobile measurement partner (MMP) for app install attribution and analytics"),
    ("branch.io", "Branch", "Performance Marketing & AdTech", "Deep linking infrastructure and cross-platform mobile attribution"),
    ("kochava.com", "Kochava", "Performance Marketing & AdTech", "Omnichannel attribution and measurement engine for mobile and CTV ads"),
    ("singular.net", "Singular", "Performance Marketing & AdTech", "Marketing analytics platform unifying ad spend and mobile attribution"),
    ("adroll.com", "AdRoll", "Performance Marketing & AdTech", "E-commerce growth marketing, retargeting, and cross-channel marketing"),
    ("smartly.io", "Smartly.io", "Performance Marketing & AdTech", "Automated social advertising platform for dynamic creative optimization"),
    ("hootsuite.com", "Hootsuite", "Performance Marketing & AdTech", "Social media management, post scheduling, and brand listening"),
    ("buffer.com", "Buffer", "Performance Marketing & AdTech", "Simple social media publishing, analytics, and engagement tools"),
    ("later.com", "Later", "Performance Marketing & AdTech", "Visual social media marketing platform specialized in Instagram scheduling"),
    ("dashthis.com", "DashThis", "Performance Marketing & AdTech", "Automated marketing reporting dashboards for digital agencies"),
    ("supermetrics.com", "Supermetrics", "Performance Marketing & AdTech", "Data connectors bringing marketing data into Google Sheets, Looker, and BigQuery"),
    ("funnel.io", "Funnel.io", "Performance Marketing & AdTech", "Automated marketing data aggregation and normalization engine"),
    ("moat.com", "Oracle Moat", "Performance Marketing & AdTech", "Ad verification, attention metrics, viewability, and invalid traffic detection"),
    ("doubleclick.net", "Google Ad Network CDN", "Performance Marketing & AdTech", "Google programmatic ad serving and conversion measurement scripts"),
    ("applovin.com", "AppLovin", "Performance Marketing & AdTech", "Leading mobile app monetization, user acquisition (MAX), and mediation"),
    ("iron-source.com", "ironSource (Unity)", "Performance Marketing & AdTech", "Mobile ad network, in-app bidding mediation, and user acquisition"),
    ("liftoff.io", "Liftoff Mobile", "Performance Marketing & AdTech", "Programmatic user acquisition and retargeting engine for mobile apps"),
    ("vungle.com", "Vungle (Liftoff)", "Performance Marketing & AdTech", "In-app video advertising platform delivering high-converting ad experiences"),
    ("inmobi.com", "InMobi", "Performance Marketing & AdTech", "Consumer intelligence and mobile programmatic advertising exchange"),
    ("moloco.com", "Moloco", "Performance Marketing & AdTech", "Machine-learning driven operational DSP for high-growth mobile advertising"),
    ("tradedesk.com", "The Trade Desk", "Performance Marketing & AdTech", "Independent media buying platform for open internet programmatic advertising"),
    ("magnite.com", "Magnite", "Performance Marketing & AdTech", "World's largest independent sell-side advertising platform (SSP)"),
    ("pubmatic.com", "PubMatic", "Performance Marketing & AdTech", "Independent programmatic advertising and publisher monetization platform"),

    # ----------------------------------------------------
    # 9. Analytics, Attribution, Tracking & SEO / AEO (40)
    # ----------------------------------------------------
    ("analytics.google.com", "Google Analytics 4 (GA4)", "Analytics, Attribution & SEO", "Web and app behavioral analytics, conversion events, and reports"),
    ("tagmanager.google.com", "Google Tag Manager (GTM)", "Analytics, Attribution & SEO", "Tag management system for deploying tracking scripts and pixels"),
    ("search.google.com", "Google Search Console", "Analytics, Attribution & SEO", "Organic search indexing, impressions, click trends, and crawl health"),
    ("lookerstudio.google.com", "Google Looker Studio", "Analytics, Attribution & SEO", "Interactive visual reporting dashboards connecting to BigQuery and GA4"),
    ("posthog.com", "PostHog", "Analytics, Attribution & SEO", "All-in-one product analytics, session replays, feature flags, and heatmaps"),
    ("app.posthog.com", "PostHog Cloud App", "Analytics, Attribution & SEO", "Web interface for managing product funnels, cohorts, and dashboards"),
    ("mixpanel.com", "Mixpanel", "Analytics, Attribution & SEO", "Event-based product analytics for tracking user conversions and retention"),
    ("amplitude.com", "Amplitude", "Analytics, Attribution & SEO", "Digital product analytics and customer journey optimization platform"),
    ("heap.io", "Heap Analytics", "Analytics, Attribution & SEO", "Automated event capture and retroactive funnel analysis for web & mobile"),
    ("segment.com", "Twilio Segment", "Analytics, Attribution & SEO", "Customer Data Platform (CDP) routing events across tools"),
    ("rudderstack.com", "RudderStack", "Analytics, Attribution & SEO", "Warehouse-first customer data platform alternative to Segment"),
    ("hotjar.com", "Hotjar", "Analytics, Attribution & SEO", "Behavior analytics with website heatmaps, session recordings, and feedback"),
    ("clarity.microsoft.com", "Microsoft Clarity", "Analytics, Attribution & SEO", "Free user behavior analytics with heatmaps and session recordings"),
    ("fullstory.com", "FullStory", "Analytics, Attribution & SEO", "Digital experience intelligence, session replay, and frustration signals"),
    ("crazyegg.com", "Crazy Egg", "Analytics, Attribution & SEO", "Click tracking, scrollmaps, and A/B testing for website optimization"),
    ("ahrefs.com", "Ahrefs", "Analytics, Attribution & SEO", "Industry-leading SEO toolset for backlink audits, keywords, and competitor analysis"),
    ("semrush.com", "Semrush", "Analytics, Attribution & SEO", "Online visibility management: SEO, PPC, keyword research, and SERP tracking"),
    ("moz.com", "Moz", "Analytics, Attribution & SEO", "SEO software, domain authority metrics, and local search marketing tools"),
    ("screamingfrog.co.uk", "Screaming Frog SEO Spider", "Analytics, Attribution & SEO", "Advanced website crawler for auditing technical on-page SEO issues"),
    ("similarweb.com", "SimilarWeb", "Analytics, Attribution & SEO", "Digital market intelligence, competitor web traffic estimates, and referrals"),
    ("builtwith.com", "BuiltWith", "Analytics, Attribution & SEO", "Website technology profiler, lead generation, and competitive tech lookup"),
    ("answerthepublic.com", "AnswerThePublic", "Analytics, Attribution & SEO", "Search listening tool revealing customer search queries and long-tail questions"),
    ("surferseo.com", "Surfer SEO", "Analytics, Attribution & SEO", "Content optimization tool leveraging NLP and competitor SERP guidelines"),
    ("clearscope.io", "Clearscope", "Analytics, Attribution & SEO", "AI-powered content optimization platform helping drive organic search traffic"),
    ("spyfu.com", "SpyFu", "Analytics, Attribution & SEO", "Competitor keyword research tool for Google Ads and organic search ranking"),
    ("brightlocal.com", "BrightLocal", "Analytics, Attribution & SEO", "Local SEO platform for managing Google Business profiles and local citations"),
    ("yoast.com", "Yoast SEO", "Analytics, Attribution & SEO", "Popular WordPress SEO plugin documentation and schema optimization rules"),
    ("rankmath.com", "Rank Math SEO", "Analytics, Attribution & SEO", "Modern WordPress SEO suite for schema markup, sitemaps, and redirects"),
    ("pingdom.com", "SolarWinds Pingdom", "Analytics, Attribution & SEO", "Global website speed testing, uptime monitoring, and latency diagnostics"),
    ("gtmetrix.com", "GTmetrix", "Analytics, Attribution & SEO", "Website performance analysis, PageSpeed insights, and waterfall charts"),
    ("pagespeed.web.dev", "PageSpeed Insights", "Analytics, Attribution & SEO", "Google official Core Web Vitals audit (LCP, INP, CLS) and diagnostic tips"),
    ("webpagetest.org", "WebPageTest", "Analytics, Attribution & SEO", "Deep web performance testing with multi-location browser profiles"),
    ("wave.webaim.org", "WAVE Web Accessibility", "Analytics, Attribution & SEO", "Web accessibility evaluation tool checking WCAG conformance"),
    ("schema.org", "Schema.org", "Analytics, Attribution & SEO", "Universal schema vocabulary for structured data and rich search snippets"),
    ("json-ld.org", "JSON-LD", "Analytics, Attribution & SEO", "JSON for Linking Data standard powering semantic web and Google markup"),
    ("plausible.io", "Plausible Analytics", "Analytics, Attribution & SEO", "Lightweight, privacy-friendly, open-source alternative to Google Analytics"),
    ("umami.is", "Umami Analytics", "Analytics, Attribution & SEO", "Self-hosted, privacy-focused open-source website analytics platform"),
    ("simpleanalytics.com", "Simple Analytics", "Analytics, Attribution & SEO", "Cookie-free, GDPR-compliant web analytics protecting visitor privacy"),
    ("metricool.com", "Metricool", "Analytics, Attribution & SEO", "Unified dashboard to analyze, manage, and grow digital presence"),
    ("statista.com", "Statista", "Analytics, Attribution & SEO", "Global market data, industry statistics, and consumer trend reports"),

    # ----------------------------------------------------
    # 10. CRO, Landing Pages, CMS, E-Commerce & Lifecycle (30)
    # ----------------------------------------------------
    ("unbounce.com", "Unbounce", "CRO, Landing Pages & Lifecycle", "AI landing page builder, Smart Traffic conversion optimization, and popups"),
    ("instapage.com", "Instapage", "CRO, Landing Pages & Lifecycle", "High-converting landing page platform built for digital advertising campaigns"),
    ("leadpages.com", "Leadpages", "CRO, Landing Pages & Lifecycle", "Lead generation website and landing page builder for small businesses"),
    ("webflow.com", "Webflow", "CRO, Landing Pages & Lifecycle", "Visual web development platform for responsive websites and CMS"),
    ("wordpress.org", "WordPress.org", "CRO, Landing Pages & Lifecycle", "Open-source content management system powering over 40% of the web"),
    ("wordpress.com", "WordPress.com", "CRO, Landing Pages & Lifecycle", "Managed WordPress hosting platform and plugin ecosystem"),
    ("elementor.com", "Elementor", "CRO, Landing Pages & Lifecycle", "Leading visual website builder for WordPress used on Sigma Tactix sites"),
    ("shopify.com", "Shopify", "CRO, Landing Pages & Lifecycle", "Leading global commerce platform powering online stores and retail point-of-sale"),
    ("myshopify.com", "Shopify Storefronts", "CRO, Landing Pages & Lifecycle", "Default merchant store domain and admin backend for Shopify stores"),
    ("apps.shopify.com", "Shopify App Store", "CRO, Landing Pages & Lifecycle", "Directory of e-commerce plugins, upsells, marketing tools, and integrations"),
    ("woocommerce.com", "WooCommerce", "CRO, Landing Pages & Lifecycle", "Customizable, open-source e-commerce platform built on WordPress"),
    ("klaviyo.com", "Klaviyo", "CRO, Landing Pages & Lifecycle", "Intelligent marketing automation platform for email, SMS, and push notifications"),
    ("mailchimp.com", "Mailchimp", "CRO, Landing Pages & Lifecycle", "Marketing automation and email marketing platform with AI features"),
    ("customer.io", "Customer.io", "CRO, Landing Pages & Lifecycle", "Automated messaging platform for tech-forward product and lifecycle teams"),
    ("activecampaign.com", "ActiveCampaign", "CRO, Landing Pages & Lifecycle", "Customer experience automation combining email marketing and CRM"),
    ("brevo.com", "Brevo (Sendinblue)", "CRO, Landing Pages & Lifecycle", "All-in-one digital marketing platform for email, SMS, WhatsApp, and chat"),
    ("resend.com", "Resend", "CRO, Landing Pages & Lifecycle", "Developer-first email API for building, testing, and delivering transactional emails"),
    ("sendgrid.com", "Twilio SendGrid", "CRO, Landing Pages & Lifecycle", "Cloud-based email infrastructure delivering billions of transactional messages"),
    ("postmarkapp.com", "Postmark", "CRO, Landing Pages & Lifecycle", "Lightning-fast transactional email delivery service with detailed analytics"),
    ("mailgun.com", "Mailgun", "CRO, Landing Pages & Lifecycle", "Email service for developers to send, receive, and track emails via API"),
    ("kit.com", "Kit (formerly ConvertKit)", "CRO, Landing Pages & Lifecycle", "Email marketing platform tailored for creators, founders, and newsletters"),
    ("optimizely.com", "Optimizely", "CRO, Landing Pages & Lifecycle", "Digital experience platform providing robust enterprise A/B testing and experimentation"),
    ("vwo.com", "VWO (Visual Website Optimizer)", "CRO, Landing Pages & Lifecycle", "A/B testing, multivariate experimentation, heatmaps, and CRO platform"),
    ("dynamic-yield.com", "Dynamic Yield (Mastercard)", "CRO, Landing Pages & Lifecycle", "AI-powered personalization and algorithmic recommendation engine"),
    ("ghost.org", "Ghost CMS", "CRO, Landing Pages & Lifecycle", "Modern open-source publishing platform for independent newsletters and journalism"),
    ("strapi.io", "Strapi", "CRO, Landing Pages & Lifecycle", "Leading open-source headless CMS built with JavaScript and TypeScript"),
    ("sanity.io", "Sanity.io", "CRO, Landing Pages & Lifecycle", "Composable content cloud with structured content and real-time collaboration"),
    ("contentful.com", "Contentful", "CRO, Landing Pages & Lifecycle", "Enterprise composable content platform delivering digital experiences at scale"),
    ("payloadcms.com", "Payload CMS", "CRO, Landing Pages & Lifecycle", "Open-source headless CMS built directly into Next.js and TypeScript"),
    ("directus.io", "Directus", "CRO, Landing Pages & Lifecycle", "Open-source data platform wrapping any SQL database with dynamic APIs"),

    # ----------------------------------------------------
    # 11. Creative Design, Motion FX, Video & Multimedia (30)
    # ----------------------------------------------------
    ("figma.com", "Figma", "Creative Design & Multimedia Assets", "Collaborative visual interface design, vector editing, and prototyping tool"),
    ("canva.com", "Canva", "Creative Design & Multimedia Assets", "Online visual design platform for social media carousels, decks, and graphics"),
    ("adobe.com", "Adobe Creative Cloud", "Creative Design & Multimedia Assets", "Industry standard creative suite (Photoshop, Illustrator, Premiere, After Effects)"),
    ("creativecloud.adobe.com", "Adobe Creative Cloud Hub", "Creative Design & Multimedia Assets", "Asset management, library syncing, and cloud documents across Adobe tools"),
    ("behance.net", "Behance", "Creative Design & Multimedia Assets", "World's largest creative network for showcasing and discovering creative work"),
    ("dribbble.com", "Dribbble", "Creative Design & Multimedia Assets", "Global community for designers, UI/UX inspiration, and design job listings"),
    ("spline.design", "Spline 3D", "Creative Design & Multimedia Assets", "Collaborative 3D design software running directly in the web browser"),
    ("lottiefiles.com", "LottieFiles", "Creative Design & Multimedia Assets", "Platform for lightweight, interactive vector JSON animations for web & apps"),
    ("unsplash.com", "Unsplash", "Creative Design & Multimedia Assets", "High-resolution open-access photography library for commercial projects"),
    ("pexels.com", "Pexels", "Creative Design & Multimedia Assets", "Free stock photos and royalty-free stock videos shared by creators"),
    ("freepik.com", "Freepik", "Creative Design & Multimedia Assets", "Graphic resources platform offering vector art, PSD templates, and AI images"),
    ("shutterstock.com", "Shutterstock", "Creative Design & Multimedia Assets", "Global provider of stock photography, vector graphics, footage, and music"),
    ("envato.com", "Envato", "Creative Design & Multimedia Assets", "Ecosystem of digital assets including ThemeForest and CodeCanyon"),
    ("elements.envato.com", "Envato Elements", "Creative Design & Multimedia Assets", "Unlimited subscription service for graphic templates, audio, and video assets"),
    ("icons8.com", "Icons8", "Creative Design & Multimedia Assets", "Comprehensive design platform with icons, illustrations, photos, and music"),
    ("flaticon.com", "Flaticon", "Creative Design & Multimedia Assets", "Largest database of free vector icons and stickers in SVG and PNG formats"),
    ("blackmagicdesign.com", "Blackmagic Design (DaVinci)", "Creative Design & Multimedia Assets", "Creators of DaVinci Resolve professional video editing and color grading"),
    ("capcut.com", "CapCut", "Creative Design & Multimedia Assets", "Popular video editing tool for social media reels, captions, and short-form video"),
    ("framer.com", "Framer", "Creative Design & Multimedia Assets", "Design and publish responsive websites with zero code, fast animations"),
    ("sketch.com", "Sketch", "Creative Design & Multimedia Assets", "Digital design toolkit for macOS with native vector editing capabilities"),
    ("penpot.app", "Penpot", "Creative Design & Multimedia Assets", "Open-source web-based design and prototyping tool built on open web standards"),
    ("blender.org", "Blender", "Creative Design & Multimedia Assets", "Free and open-source 3D creation suite supporting modeling, rigging, and VFX"),
    ("kapwing.com", "Kapwing", "Creative Design & Multimedia Assets", "Collaborative online video editor for meme generation, subtitles, and clips"),
    ("descript.com", "Descript", "Creative Design & Multimedia Assets", "All-in-one video and podcast editing tool that works like a text document"),
    ("otter.ai", "Otter.ai", "Creative Design & Multimedia Assets", "AI meeting assistant providing automated real-time speech transcription"),
    ("riverside.fm", "Riverside.fm", "Creative Design & Multimedia Assets", "Studio-quality podcast and video recording directly from the browser"),
    ("epidemicsound.com", "Epidemic Sound", "Creative Design & Multimedia Assets", "Royalty-free soundtrack and sound effect library for content creators"),
    ("artlist.io", "Artlist", "Creative Design & Multimedia Assets", "Creative platform providing royalty-free music, sound effects, and stock footage"),
    ("soundstripe.com", "Soundstripe", "Creative Design & Multimedia Assets", "Unlimited royalty-free music and video content for film and advertising"),
    ("svgrepo.com", "SVG Repo", "Creative Design & Multimedia Assets", "Searchable repository of free vectors and open-source SVG icons"),

    # ----------------------------------------------------
    # 12. Trading, Forex, Fintech, Crypto & Payments (35)
    # ----------------------------------------------------
    ("tradingview.com", "TradingView", "Trading, Forex, Fintech & Payments", "Charting platform and social network for active financial traders and quants"),
    ("mql5.com", "MQL5 Community", "Trading, Forex, Fintech & Payments", "Official portal for MetaTrader 4 & 5 Expert Advisors (EA), indicators, and code"),
    ("metaquotes.net", "MetaQuotes", "Trading, Forex, Fintech & Payments", "Software development company behind the MetaTrader financial trading platforms"),
    ("exness.com", "Exness Global Broker", "Trading, Forex, Fintech & Payments", "Multi-asset financial broker popular for algorithmic trading and low spreads"),
    ("forexfactory.com", "Forex Factory", "Trading, Forex, Fintech & Payments", "High-impact economic calendar, market news, and currency trader forums"),
    ("dailyfx.com", "DailyFX", "Trading, Forex, Fintech & Payments", "Forex news, technical analysis, and market sentiment reports by IG"),
    ("investing.com", "Investing.com", "Trading, Forex, Fintech & Payments", "Financial market portal covering real-time quotes, charts, and news"),
    ("bloomberg.com", "Bloomberg", "Trading, Forex, Fintech & Payments", "Global business and financial market data, breaking news, and analytics"),
    ("reuters.com", "Reuters", "Trading, Forex, Fintech & Payments", "International news agency covering global financial markets and macro trends"),
    ("ft.com", "Financial Times", "Trading, Forex, Fintech & Payments", "Global business news, economic analysis, and financial reporting"),
    ("coinmarketcap.com", "CoinMarketCap", "Trading, Forex, Fintech & Payments", "Cryptocurrency market cap rankings, token prices, and trading volume"),
    ("coingecko.com", "CoinGecko", "Trading, Forex, Fintech & Payments", "Independent cryptocurrency data aggregator tracking prices and on-chain stats"),
    ("binance.com", "Binance", "Trading, Forex, Fintech & Payments", "World's largest cryptocurrency exchange by trading volume and liquidity"),
    ("bybit.com", "Bybit", "Trading, Forex, Fintech & Payments", "Cryptocurrency derivatives and spot exchange popular in the UAE/GCC"),
    ("okx.com", "OKX", "Trading, Forex, Fintech & Payments", "Global cryptocurrency exchange and Web3 digital wallet ecosystem"),
    ("kraken.com", "Kraken", "Trading, Forex, Fintech & Payments", "Security-focused cryptocurrency exchange providing spot and futures trading"),
    ("coinbase.com", "Coinbase", "Trading, Forex, Fintech & Payments", "Regulated digital currency exchange platform and developer API"),
    ("kucoin.com", "KuCoin", "Trading, Forex, Fintech & Payments", "Global cryptocurrency exchange with spot, margin, and algorithmic bot trading"),
    ("stripe.com", "Stripe", "Trading, Forex, Fintech & Payments", "Financial infrastructure for the internet: global payment processing APIs"),
    ("docs.stripe.com", "Stripe Documentation", "Trading, Forex, Fintech & Payments", "Developer documentation for payment intents, billing, and webhooks"),
    ("paypal.com", "PayPal", "Trading, Forex, Fintech & Payments", "Global online payments system facilitating worldwide money transfers"),
    ("developer.paypal.com", "PayPal Developer Portal", "Trading, Forex, Fintech & Payments", "APIs, SDKs, and sandboxes for integrating PayPal checkout and subscriptions"),
    ("oxapay.com", "OxaPay", "Trading, Forex, Fintech & Payments", "Crypto payment gateway for accepting payments with low merchant fees"),
    ("wise.com", "Wise (formerly TransferWise)", "Trading, Forex, Fintech & Payments", "International money transfers and multi-currency business accounts"),
    ("revolut.com", "Revolut", "Trading, Forex, Fintech & Payments", "Global financial super-app offering banking, currency exchange, and cards"),
    ("centralbank.ae", "Central Bank of the UAE (CBUAE)", "Trading, Forex, Fintech & Payments", "Monetary and regulatory authority overseeing UAE banking and financial stability"),
    ("difc.ae", "Dubai International Financial Centre (DIFC)", "Trading, Forex, Fintech & Payments", "Leading financial hub in Middle East, Africa, and South Asia"),
    ("adgm.com", "Abu Dhabi Global Market (ADGM)", "Trading, Forex, Fintech & Payments", "International financial centre and free zone in Abu Dhabi UAE"),
    ("myfxbook.com", "Myfxbook", "Trading, Forex, Fintech & Payments", "Automated analytical tool and verified social community for forex accounts"),
    ("babypips.com", "BabyPips", "Trading, Forex, Fintech & Payments", "Comprehensive educational school of pipsology for forex trading beginners"),
    ("fxstreet.com", "FXStreet", "Trading, Forex, Fintech & Payments", "Real-time forex news, technical indicators, and currency market analysis"),
    ("finviz.com", "FINVIZ", "Trading, Forex, Fintech & Payments", "Stock market screener, financial visualizer, and heatmaps"),
    ("cointelegraph.com", "Cointelegraph", "Trading, Forex, Fintech & Payments", "Independent digital media outlet covering blockchain and crypto finance"),
    ("coindesk.com", "CoinDesk", "Trading, Forex, Fintech & Payments", "News and data platform covering cryptocurrency, digital assets, and Web3"),
    ("coolors.co", "Coolors Palette", "Trading, Forex, Fintech & Payments", "UI brand aesthetic and chart color formatting tools"),

    # ----------------------------------------------------
    # 13. B2B Growth, Sales Intelligence, Outbound & CRM (30)
    # ----------------------------------------------------
    ("hubspot.com", "HubSpot", "B2B Growth, Outbound & CRM", "Inbound marketing, sales CRM, customer service, and CMS platform"),
    ("app.hubspot.com", "HubSpot App Portal", "B2B Growth, Outbound & CRM", "Web app for pipeline management, contact lists, and email sequences"),
    ("salesforce.com", "Salesforce", "B2B Growth, Outbound & CRM", "Enterprise customer relationship management (CRM) cloud platform"),
    ("apollo.io", "Apollo.io", "B2B Growth, Outbound & CRM", "B2B lead intelligence, verified contact data, and sales engagement sequencer"),
    ("zoominfo.com", "ZoomInfo", "B2B Growth, Outbound & CRM", "Go-to-market intelligence platform with enterprise B2B contact data"),
    ("lusha.com", "Lusha", "B2B Growth, Outbound & CRM", "B2B contact enrichment tool providing verified phone numbers and emails"),
    ("hunter.io", "Hunter.io", "B2B Growth, Outbound & CRM", "Email finder and domain search tool for discovering professional email patterns"),
    ("clay.com", "Clay.com", "B2B Growth, Outbound & CRM", "Data enrichment and automated outbound prospecting platform powered by AI"),
    ("lemlist.com", "Lemlist", "B2B Growth, Outbound & CRM", "Personalized cold email outreach platform with automated email warmup"),
    ("instantly.ai", "Instantly.ai", "B2B Growth, Outbound & CRM", "Unlimited cold email sending, deliverability warmup, and lead database"),
    ("smartlead.ai", "Smartlead.ai", "B2B Growth, Outbound & CRM", "Cold email software with AI email warmup and multi-inbox rotation"),
    ("phantombuster.com", "PhantomBuster", "B2B Growth, Outbound & CRM", "No-code lead generation and data extraction tool for LinkedIn and social platforms"),
    ("waalaxy.com", "Waalaxy", "B2B Growth, Outbound & CRM", "Automated LinkedIn prospecting and multichannel cold outreach tool"),
    ("outreach.io", "Outreach", "B2B Growth, Outbound & CRM", "Sales execution platform for revenue teams to automate sales pipelines"),
    ("salesloft.com", "Salesloft", "B2B Growth, Outbound & CRM", "Sales engagement software providing automated cadences and conversational AI"),
    ("seamless.ai", "Seamless.ai", "B2B Growth, Outbound & CRM", "Real-time search engine for B2B sales leads and contact phone numbers"),
    ("clearbit.com", "Clearbit (HubSpot)", "B2B Growth, Outbound & CRM", "Marketing data engine providing real-time firmographic company enrichment"),
    ("crunchbase.com", "Crunchbase", "B2B Growth, Outbound & CRM", "Business database covering company funding rounds, founders, and acquisitions"),
    ("pitchbook.com", "PitchBook", "B2B Growth, Outbound & CRM", "Private capital market data covering venture capital, private equity, and M&A"),
    ("pipedrive.com", "Pipedrive", "B2B Growth, Outbound & CRM", "Visual sales CRM focused on pipeline stages and activity-based selling"),
    ("close.com", "Close CRM", "B2B Growth, Outbound & CRM", "Inside sales CRM with integrated calling, SMS, and email sequences"),
    ("folk.app", "Folk", "B2B Growth, Outbound & CRM", "Lightweight, customizable CRM built for modern teams and relationship building"),
    ("attio.com", "Attio", "B2B Growth, Outbound & CRM", "Next-generation customizable CRM powered by real-time data sync and AI"),
    ("mailreach.co", "Mailreach", "B2B Growth, Outbound & CRM", "Email warm-up and spam checker tool to land cold emails in the primary inbox"),
    ("neverbounce.com", "NeverBounce", "B2B Growth, Outbound & CRM", "Real-time email verification and list cleaning service preventing bounces"),
    ("zerobounce.net", "ZeroBounce", "B2B Growth, Outbound & CRM", "Email validation, deliverability toolkit, and blacklist monitoring"),
    ("dropcontact.com", "Dropcontact", "B2B Growth, Outbound & CRM", "Automated B2B contact enrichment and duplicate cleaning service"),
    ("kaspr.io", "Kaspr", "B2B Growth, Outbound & CRM", "LinkedIn contact scraper providing verified phone numbers and emails"),
    ("contactout.com", "ContactOut", "B2B Growth, Outbound & CRM", "Search engine for contact data finding personal emails and phone numbers"),
    ("dealfront.com", "Dealfront", "B2B Growth, Outbound & CRM", "European go-to-market platform combining IP tracking, data, and prospecting"),

    # ----------------------------------------------------
    # 14. Security, Privacy, Compliance & Identity (25)
    # ----------------------------------------------------
    ("owasp.org", "OWASP", "Security, Privacy & Compliance", "Open Worldwide Application Security Project standards and vulnerability guides"),
    ("radar.cloudflare.com", "Cloudflare Radar", "Security, Privacy & Compliance", "Global internet traffic insights, cyberattack trends, and protocol analytics"),
    ("cve.mitre.org", "MITRE CVE", "Security, Privacy & Compliance", "Common Vulnerabilities and Exposures dictionary and cybersecurity database"),
    ("haveibeenpwned.com", "Have I Been Pwned", "Security, Privacy & Compliance", "Compromised account data verification service by Troy Hunt"),
    ("snyk.io", "Snyk", "Security, Privacy & Compliance", "Developer security platform finding vulnerabilities in code, npm, and containers"),
    ("sonarqube.org", "SonarQube", "Security, Privacy & Compliance", "Continuous inspection code quality and security static analysis tool"),
    ("auth0.com", "Auth0 by Okta", "Security, Privacy & Compliance", "Authentication and authorization platform for web, mobile, and legacy apps"),
    ("clerk.com", "Clerk", "Security, Privacy & Compliance", "User management and authentication platform built for Next.js and React"),
    ("stytch.com", "Stytch", "Security, Privacy & Compliance", "Developer platform for passwordless authentication, passkeys, and B2B SaaS auth"),
    ("kinde.com", "Kinde", "Security, Privacy & Compliance", "Simple authentication, user management, and feature flags for modern apps"),
    ("1password.com", "1Password", "Security, Privacy & Compliance", "Secure password manager and enterprise credential vault"),
    ("bitwarden.com", "Bitwarden", "Security, Privacy & Compliance", "Open-source password manager for secure credential storage and team sharing"),
    ("letsencrypt.org", "Let's Encrypt", "Security, Privacy & Compliance", "Non-profit certificate authority providing free automated TLS/SSL certificates"),
    ("ssllabs.com", "Qualys SSL Labs", "Security, Privacy & Compliance", "Deep technical analysis and scoring of SSL/TLS web server configuration"),
    ("gdpr.eu", "GDPR.eu", "Security, Privacy & Compliance", "General Data Protection Regulation official portal, checklists, and compliance guides"),
    ("ftc.gov", "Federal Trade Commission (FTC)", "Security, Privacy & Compliance", "US consumer protection, digital advertising disclosure guidelines, and antitrust"),
    ("cloudsecurityalliance.org", "Cloud Security Alliance (CSA)", "Security, Privacy & Compliance", "Organization dedicated to defining cloud computing security best practices"),
    ("cisa.gov", "CISA", "Security, Privacy & Compliance", "Cybersecurity and Infrastructure Security Agency alerts and threat advisories"),
    ("nist.gov", "NIST", "Security, Privacy & Compliance", "National Institute of Standards and Technology cybersecurity framework"),
    ("virustotal.com", "VirusTotal", "Security, Privacy & Compliance", "Free online service analyzing suspicious files and URLs for malware"),
    ("shodan.io", "Shodan", "Security, Privacy & Compliance", "Search engine for internet-connected devices, open ports, and infrastructure"),
    ("securityheaders.com", "Security Headers", "Security, Privacy & Compliance", "Analysis of HTTP response headers including CSP, HSTS, and X-Frame-Options"),
    ("dnschecker.org", "DNS Checker", "Security, Privacy & Compliance", "Global DNS propagation checker testing records across worldwide servers"),
    ("mxtoolbox.com", "MxToolbox", "Security, Privacy & Compliance", "DNS lookup, MX records check, and blacklists validation for email deliverability"),
    ("whois.com", "Whois.com", "Security, Privacy & Compliance", "Domain registration lookup, IP address intelligence, and registrar records"),

    # ----------------------------------------------------
    # 15. Productivity, Workspaces, Operating Systems & GCC Hubs (25)
    # ----------------------------------------------------
    ("notion.so", "Notion", "Productivity, Workspaces & Regional Hubs", "All-in-one workspace for notes, project management, and team documentation"),
    ("obsidian.md", "Obsidian", "Productivity, Workspaces & Regional Hubs", "Extensible knowledge base working on local Markdown files (Personal Brain)"),
    ("slack.com", "Slack", "Productivity, Workspaces & Regional Hubs", "Team collaboration hub with channels, messaging, and app integrations"),
    ("discord.com", "Discord", "Productivity, Workspaces & Regional Hubs", "Voice, video, and text communication platform popular in AI & developer circles"),
    ("linear.app", "Linear", "Productivity, Workspaces & Regional Hubs", "Fast, modern issue tracking tool built specifically for high-performing software teams"),
    ("atlassian.com", "Atlassian", "Productivity, Workspaces & Regional Hubs", "Enterprise collaboration software provider behind Jira, Confluence, and Trello"),
    ("jira.atlassian.com", "Jira Software", "Productivity, Workspaces & Regional Hubs", "Agile project and issue tracking tool for enterprise development teams"),
    ("asana.com", "Asana", "Productivity, Workspaces & Regional Hubs", "Work management platform helping teams orchestrate projects and daily tasks"),
    ("monday.com", "Monday.com", "Productivity, Workspaces & Regional Hubs", "Customizable Work OS for managing projects, workflows, and resource planning"),
    ("trello.com", "Trello", "Productivity, Workspaces & Regional Hubs", "Visual Kanban board application for organizing projects and task workflows"),
    ("loom.com", "Loom", "Productivity, Workspaces & Regional Hubs", "Async video messaging tool for screen recording, client feedback, and bug reviews"),
    ("miro.com", "Miro", "Productivity, Workspaces & Regional Hubs", "Visual workspace for team brainstorming, wireframing, and architecture diagrams"),
    ("coda.io", "Coda", "Productivity, Workspaces & Regional Hubs", "All-in-one collaborative doc that brings words, data, and teams together"),
    ("docs.google.com", "Google Docs", "Productivity, Workspaces & Regional Hubs", "Real-time collaborative word processing and document editing"),
    ("drive.google.com", "Google Drive", "Productivity, Workspaces & Regional Hubs", "Cloud file storage and backup synchronization service"),
    ("office.com", "Microsoft 365", "Productivity, Workspaces & Regional Hubs", "Cloud productivity suite including Word, Excel, PowerPoint, and Teams"),
    ("zoom.us", "Zoom", "Productivity, Workspaces & Regional Hubs", "Video conferencing, webinars, and virtual meeting communication software"),
    ("meet.google.com", "Google Meet", "Productivity, Workspaces & Regional Hubs", "Real-time enterprise video meetings integrated into Google Workspace"),
    ("airtable.com", "Airtable", "Productivity, Workspaces & Regional Hubs", "Low-code platform for building collaborative databases and business workflows"),
    ("clickup.com", "ClickUp", "Productivity, Workspaces & Regional Hubs", "All-in-one productivity platform for tasks, docs, chat, and goals"),
    ("basecamp.com", "Basecamp", "Productivity, Workspaces & Regional Hubs", "Project management and team communication software emphasizing simplicity"),
    ("dubaided.gov.ae", "Dubai Economy & Tourism (DET)", "Productivity, Workspaces & Regional Hubs", "Government entity regulating commercial licensing and economy in Dubai UAE"),
    ("ajmanfreezone.gov.ae", "Ajman Free Zone (AFZ)", "Productivity, Workspaces & Regional Hubs", "Free zone authority regulating Sigma Tactix Consultancy LLC FZE license"),
    ("u.ae", "UAE Government Unified Portal", "Productivity, Workspaces & Regional Hubs", "Official portal of the United Arab Emirates government services and laws"),
    ("investinuae.com", "Invest in UAE", "Productivity, Workspaces & Regional Hubs", "Official UAE portal for foreign investment, business setup, and visas")
]

def main():
    print(f"Total raw sites defined: {len(raw_sites)}")
    
    # Assert exact count
    assert len(raw_sites) == 500, f"Expected 500 sites, found {len(raw_sites)}"
    
    # Verify uniqueness
    domains = [s[0].strip().lower() for s in raw_sites]
    counts = Counter(domains)
    dups = [d for d, c in counts.items() if c > 1]
    if dups:
        raise ValueError(f"Duplicate domains detected: {dups}")
    
    # Category distribution
    categories = Counter(s[2] for s in raw_sites)
    print("\nCategory Breakdown (15 categories):")
    for cat, count in categories.items():
        print(f"  - {cat}: {count}")
    
    # Format structured items
    structured_sites = []
    launch_preview_origins = []
    allowed_domains = []
    
    for idx, (domain, name, category, relevance) in enumerate(raw_sites, 1):
        clean_domain = domain.strip().lower()
        origin = f"https://{clean_domain}"
        launch_preview_origins.append(origin)
        allowed_domains.append(clean_domain)
        structured_sites.append({
            "id": idx,
            "domain": clean_domain,
            "origin": origin,
            "name": name,
            "category": category,
            "relevance": relevance
        })
    
    payload = {
        "metadata": {
            "title": "500 Curated Safe Allowed Sites for Claude Cowork & Claude Desktop",
            "version": "1.0.0",
            "totalSites": 500,
            "generatedAt": "2026-10-27",
            "owner": "Nazim Khwaja (Sigma Tactix Consultancy LLC FZE)",
            "jurisdiction": "Dubai, UAE",
            "profileSummary": {
                "industry": "B2B Growth OS, Performance Marketing, AdTech, MarTech, E-Commerce, Fintech & Algorithmic Trading",
                "business": "Sigma Tactix Consultancy LLC FZE & Sigma Tactix Growth OS",
                "occupation": "Founder, Growth Architect, AI Practitioner / Vibe Coder, Performance Marketing Lead",
                "coreTechStack": "Claude Desktop / Cowork, Supabase, Ollama, Docker, n8n, Hostinger, Cloudflare, React, Vite, Node.js, Python, MCP"
            },
            "purpose": "Comprehensive safe list / allowlist of 500 high-relevance web domains, GitHub ecosystem services, APIs, and dev hubs for Claude Cowork / Desktop configuration files.",
            "configTargetLocations": [
                "~/Library/Application Support/Claude-3p/claude_desktop_config.json (preferences.launchPreviewAllowedOrigins)",
                "~/Library/Application Support/Claude/claude_desktop_config.json (preferences.launchPreviewAllowedOrigins)",
                "~/.claude/settings.json (permissions.allowedDomains)",
                "~/Claude/claude-cowork-allowed-sites-500.json (Native Claude Cowork workspace)"
            ]
        },
        "categorySummary": dict(categories),
        "claudeDesktopConfigSnippet": {
            "preferences": {
                "launchPreviewAllowedOrigins": launch_preview_origins
            }
        },
        "claudeCodeSettingsSnippet": {
            "permissions": {
                "allowedDomains": allowed_domains
            }
        },
        "allowedDomains": allowed_domains,
        "launchPreviewAllowedOrigins": launch_preview_origins,
        "sites": structured_sites
    }
    
    # Save to workspace path
    workspace_path = "/Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/docs/claude-cowork-allowed-sites-500.json"
    os.makedirs(os.path.dirname(workspace_path), exist_ok=True)
    with open(workspace_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    print(f"\n[SUCCESS] Wrote 500 allowed sites to workspace: {workspace_path}")
    
    # Also save to Claude Cowork directory (/Users/mac/Claude/)
    claude_cowork_dir = "/Users/mac/Claude"
    if os.path.exists(claude_cowork_dir):
        cowork_file_path = os.path.join(claude_cowork_dir, "claude-cowork-allowed-sites-500.json")
        with open(cowork_file_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        print(f"[SUCCESS] Wrote copy to Claude Cowork directory: {cowork_file_path}")

if __name__ == "__main__":
    main()
