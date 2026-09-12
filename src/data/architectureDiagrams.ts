export interface DiagramView {
  id: string;
  label: string;
  focus: string[];
  note: string;
}

export interface DiagramCard {
  dot: 'emerald' | 'amber' | 'rose' | 'cyan' | 'orange';
  title: string;
  items: string[];
}

export interface LifecycleState {
  id: string;
  type: 'start' | 'active' | 'decision' | 'waiting' | 'success' | 'failure';
  label: string;
  sublabel: string;
  lane: string;
  col: number;
  step?: string;
  tag?: string;
  yOffset?: number;
}

export interface LifecycleTransition {
  id?: string;
  from: string;
  to: string;
  variant?: 'default' | 'emphasis' | 'security' | 'dashed';
  fromSide?: string;
  toSide?: string;
  route?: string;
  via?: [number, number][];
  label?: string;
  role?: string;
}

export interface ArchitectureComponent {
  id: string;
  type: 'external' | 'cloud' | 'security' | 'backend' | 'database' | 'messagebus' | 'frontend';
  label: string;
  sublabel: string;
  pos?: [number, number];
  size?: [number, number];
  tag?: string;
  stage?: number;
  row?: number;
  lane?: string;
  col?: number;
  width?: number;
  yOffset?: number;
}

export interface ArchitectureConnection {
  id?: string;
  from: string;
  to: string;
  label?: string;
  variant?: 'default' | 'emphasis' | 'security' | 'dashed';
  fromSide?: string;
  toSide?: string;
  route?: string;
  via?: [number, number][];
  labelAt?: [number, number];
  labelDy?: number;
  classification?: string;
  role?: string;
  width?: number;
}

export interface SequenceMessage {
  id?: string;
  from: string;
  to: string;
  y?: number;
  label: string;
  variant?: 'default' | 'emphasis' | 'security' | 'return' | 'dashed';
}

export interface ArchitectureDiagram {
  id: string;
  schema_version: number;
  diagram_type: 'lifecycle' | 'workflow' | 'sequence' | 'dataflow' | 'architecture';
  meta: {
    title: string;
    description: string;
    layer: 'Foundation' | 'Intelligence' | 'Creation' | 'Agent' | 'Infrastructure';
    views: DiagramView[];
  };
  lanes?: { id: string; label: string; variant?: string }[];
  stages?: { label: string }[];
  states?: LifecycleState[];
  transitions?: LifecycleTransition[];
  components?: ArchitectureComponent[];
  nodes?: ArchitectureComponent[];
  participants?: ArchitectureComponent[];
  connections?: ArchitectureConnection[];
  flows?: ArchitectureConnection[];
  edges?: ArchitectureConnection[];
  messages?: SequenceMessage[];
  cards: DiagramCard[];
}

export const ARCHITECTURE_DIAGRAMS: ArchitectureDiagram[] = [
  {
    id: 'agent-run-lifecycle',
    schema_version: 1,
    diagram_type: 'lifecycle',
    meta: {
      title: 'Agent Run Lifecycle',
      description: 'Ordered phases from accepted client request to completed agentic execution with human gate pauses and retryable recovery.',
      layer: 'Agent',
      views: [
        { id: 'main-lifecycle', label: 'Main Lifecycle', focus: ['queued', 'planning', 'executing', 'reviewing', 'completed'], note: 'Follow the ordered phases from accepted request to completed response.' },
        { id: 'human-waits', label: 'Human & Input Waits', focus: ['executing', 'approval', 'reviewing', 'blocked'], note: 'See where the run pauses without becoming terminal.' },
        { id: 'recovery-and-exits', label: 'Recovery & Terminal Exits', focus: ['executing', 'failed', 'blocked', 'cancelled', 'expired'], note: 'Separate retryable failure from cancellation and expiry.' }
      ]
    },
    lanes: [
      { id: 'main', label: 'Lifecycle phases' },
      { id: 'waiting', label: 'Interruptions & Human Gates' },
      { id: 'exceptions', label: 'Recovery loop' },
      { id: 'terminal', label: 'Terminal exits' }
    ],
    states: [
      { id: 'queued', type: 'start', label: 'Queued', sublabel: 'request accepted', lane: 'main', col: 0, step: '01', tag: 'entry' },
      { id: 'planning', type: 'active', label: 'Planning', sublabel: 'build task graph', lane: 'main', col: 1, step: '02', tag: 'model' },
      { id: 'executing', type: 'active', label: 'Executing', sublabel: 'tool calls', lane: 'main', col: 2, step: '03', tag: 'work' },
      { id: 'reviewing', type: 'decision', label: 'Reviewing', sublabel: 'quality gate', lane: 'main', col: 3, step: '04', tag: 'check' },
      { id: 'completed', type: 'success', label: 'Completed', sublabel: 'final response', lane: 'main', col: 4, step: '05', tag: 'done' },
      { id: 'approval', type: 'waiting', label: 'Needs Approval', sublabel: 'human gate', lane: 'waiting', col: 0, tag: 'pause' },
      { id: 'blocked', type: 'waiting', label: 'Blocked', sublabel: 'missing input', lane: 'waiting', col: 1, tag: 'wait' },
      { id: 'failed', type: 'failure', label: 'Failed', sublabel: 'recoverable error', lane: 'exceptions', col: 0, yOffset: 78, tag: 'retryable' },
      { id: 'cancelled', type: 'failure', label: 'Cancelled', sublabel: 'user stopped', lane: 'terminal', col: 0, tag: 'terminal' },
      { id: 'expired', type: 'failure', label: 'Expired', sublabel: 'timeout', lane: 'terminal', col: 1, tag: 'terminal' }
    ],
    transitions: [
      { id: 'approval-needed', from: 'executing', to: 'approval', variant: 'security', fromSide: 'bottom', toSide: 'top', route: 'straight', label: 'Destructive / Public Action' },
      { id: 'review-blocked', from: 'reviewing', to: 'blocked', variant: 'default', route: 'drop', label: 'Missing Input' },
      { id: 'execution-failed', from: 'executing', to: 'failed', variant: 'security', label: 'API Exception' },
      { id: 'failed-retry', from: 'failed', to: 'executing', variant: 'emphasis', label: 'Retry Budget > 0' },
      { id: 'block-expired', from: 'blocked', to: 'expired', variant: 'security', route: 'straight', label: 'TTL Timeout' },
      { id: 'approval-cancelled', from: 'approval', to: 'cancelled', variant: 'security', label: 'User Rejected' }
    ],
    cards: [
      {
        dot: 'emerald',
        title: 'Main Path',
        items: [
          'The run has five ordered phases from queue to completion',
          'The primary lifecycle is carried by one horizontal rail',
          'Completion is a phase, not a detached side box'
        ]
      },
      {
        dot: 'amber',
        title: 'Human + Input Gates',
        items: [
          'Approval pauses execution without ending the run',
          'Blocked waits for missing user input',
          'Wait states remain non-terminal until cancellation or expiry'
        ]
      },
      {
        dot: 'rose',
        title: 'Terminal + Recovery',
        items: [
          'Failed loops back while retry budget remains',
          'Cancelled and Expired are exits from the lifecycle',
          'Terminal exits do not point back into active execution'
        ]
      }
    ]
  },
  {
    id: 'agent-tool-call-workflow',
    schema_version: 2,
    diagram_type: 'workflow',
    meta: {
      title: 'Agent Tool Call Workflow',
      description: 'Guarded tool execution workflow with RBAC policy enforcement, human approval gates, and durable context trace memory.',
      layer: 'Agent',
      views: [
        { id: 'happy-path', label: 'Request to Result', focus: ['user', 'chat', 'planner', 'router', 'approval', 'tool', 'external', 'final'], note: 'Follow the successful request from user intent to the final reply.' },
        { id: 'safety-gate', label: 'Policy & Recovery', focus: ['router', 'approval', 'blocked', 'retry'], note: 'See where risky work stops, waits for consent, or returns for revision.' },
        { id: 'evidence-loop', label: 'Evidence & Memory', focus: ['external', 'store', 'trace'], note: 'Isolate the durable trace and context path behind the visible answer.' }
      ]
    },
    lanes: [
      { id: 'ui', label: 'User Interface' },
      { id: 'agent', label: 'Agent Runtime' },
      { id: 'policy', label: 'Policy & Recovery', variant: 'exception' },
      { id: 'tools', label: 'Tool Execution & Evidence' }
    ],
    nodes: [
      { id: 'user', lane: 'ui', col: 0, type: 'external', label: 'User', sublabel: 'asks for work', width: 132 },
      { id: 'chat', lane: 'ui', col: 1, type: 'frontend', label: 'Chat Surface', sublabel: 'thread + files', width: 132 },
      { id: 'planner', lane: 'agent', col: 2, type: 'backend', label: 'Agent Planner', sublabel: 'plan next step', tag: 'context aware', width: 132 },
      { id: 'router', lane: 'agent', col: 3, type: 'backend', label: 'Tool Router', sublabel: 'choose capability', width: 132 },
      { id: 'approval', lane: 'policy', col: 3, type: 'security', label: 'Approval Gate', sublabel: 'scope + consent', tag: 'block risky ops', width: 132 },
      { id: 'blocked', lane: 'policy', col: 4, type: 'security', label: 'Blocked', sublabel: 'wait or reject', width: 132 },
      { id: 'retry', lane: 'policy', col: 5, type: 'messagebus', label: 'Retry Path', sublabel: 'revise request', width: 132 },
      { id: 'tool', lane: 'tools', col: 4, type: 'messagebus', label: 'Tool Call', sublabel: 'shell / browser / MCP', tag: 'structured result', width: 132 },
      { id: 'external', lane: 'tools', col: 5, type: 'cloud', label: 'External API', sublabel: 'network service', width: 132 },
      { id: 'store', lane: 'tools', col: 1, type: 'database', label: 'Context Store', sublabel: 'Second Brain RAG', width: 132 },
      { id: 'trace', lane: 'tools', col: 2, type: 'database', label: 'Trace Log', sublabel: 'events + output', width: 132 },
      { id: 'final', lane: 'ui', col: 5, type: 'backend', label: 'Final Reply', sublabel: 'answer + changes', width: 132 }
    ],
    edges: [
      { id: 'request-chat', from: 'user', to: 'chat', variant: 'default', label: 'prompt' },
      { id: 'plan-request', from: 'chat', to: 'planner', label: 'plan', variant: 'emphasis' },
      { id: 'planner-route', from: 'planner', to: 'router', variant: 'default', label: 'route' },
      { id: 'approval-check', from: 'router', to: 'approval', label: 'needs approval?', variant: 'security' },
      { id: 'approved-tool', from: 'approval', to: 'tool', variant: 'emphasis', label: 'approved' },
      { id: 'approval-denied', from: 'approval', to: 'blocked', label: 'denied', variant: 'security', role: 'error' },
      { id: 'retry-request', from: 'blocked', to: 'retry', variant: 'dashed', role: 'branch', label: 'retry' },
      { id: 'tool-external-call', from: 'tool', to: 'external', variant: 'default', label: 'invoke' },
      { id: 'external-reply', from: 'external', to: 'final', variant: 'emphasis', label: 'payload' },
      { id: 'record-result', from: 'external', to: 'trace', label: 'record result', variant: 'dashed' },
      { id: 'write-trace-memory', from: 'store', to: 'trace', label: 'trace + memory', variant: 'dashed' }
    ],
    cards: [
      {
        dot: 'cyan',
        title: 'Compiler Contract',
        items: [
          'Lanes and columns determine node placement',
          'Labels reserve clearance; routes stay orthogonal'
        ]
      },
      {
        dot: 'rose',
        title: 'Runtime Semantics',
        items: [
          'Approval gates risky work before tool execution',
          'Evidence returns through isolated trace and memory'
        ]
      }
    ]
  },
  {
    id: 'async-job-roundtrip',
    schema_version: 1,
    diagram_type: 'sequence',
    meta: {
      title: 'Async Job Roundtrip',
      description: 'Non-blocking async task orchestration with BullMQ queue, provider invocation, and durable webhook notification.',
      layer: 'Infrastructure',
      views: [
        { id: 'accept-and-enqueue', label: 'Accept Without Blocking', focus: ['client', 'api', 'queue'], note: 'The API acknowledges quickly after durable enqueue.' },
        { id: 'work-and-retry', label: 'Background Work & Retry', focus: ['queue', 'worker', 'provider'], note: 'Timeouts re-enter the queue instead of holding the original request open.' },
        { id: 'observe-final-state', label: 'Observe Final Consistency', focus: ['worker', 'store', 'notify', 'client', 'api'], note: 'Webhook delivery is primary; polling remains a bounded fallback.' }
      ]
    },
    participants: [
      { id: 'client', type: 'external', label: 'Client', sublabel: 'Growth OS Cockpit' },
      { id: 'api', type: 'backend', label: 'Jobs API', sublabel: 'FastAPI Edge' },
      { id: 'queue', type: 'messagebus', label: 'Queue', sublabel: 'BullMQ / Redis' },
      { id: 'worker', type: 'backend', label: 'Worker', sublabel: 'Agent Task Pod' },
      { id: 'provider', type: 'cloud', label: 'Provider', sublabel: 'Gemini / External API' },
      { id: 'store', type: 'database', label: 'Job Store', sublabel: 'PostgreSQL DB' },
      { id: 'notify', type: 'messagebus', label: 'Notifier', sublabel: 'Signed Webhook' }
    ],
    messages: [
      { from: 'client', to: 'api', label: 'POST /api/v1/jobs', variant: 'emphasis' },
      { from: 'api', to: 'queue', label: 'enqueue job (payload, timeout)', variant: 'emphasis' },
      { from: 'api', to: 'client', label: '202 Accepted + job_id', variant: 'return' },
      { from: 'queue', to: 'worker', label: 'deliver worker task', variant: 'emphasis' },
      { from: 'worker', to: 'provider', label: 'perform LLM / ETL work', variant: 'default' },
      { from: 'provider', to: 'worker', label: 'execution result / timeout', variant: 'return' },
      { from: 'worker', to: 'queue', label: 'retry with backoff if timeout', variant: 'dashed' },
      { from: 'worker', to: 'store', label: 'persist final state in Vault', variant: 'emphasis' },
      { from: 'worker', to: 'notify', label: 'emit job.completed event', variant: 'dashed' },
      { from: 'notify', to: 'client', label: 'signed webhook dispatch', variant: 'dashed' },
      { from: 'client', to: 'api', label: 'GET /api/v1/jobs/:id', variant: 'default' },
      { from: 'api', to: 'store', label: 'read job status & artifact', variant: 'default' },
      { from: 'store', to: 'api', label: 'completed payload', variant: 'return' },
      { from: 'api', to: 'client', label: '200 OK final result', variant: 'return' }
    ],
    cards: [
      { dot: 'cyan', title: 'Fast Acknowledgement', items: ['The caller receives a durable job id before work begins', 'Queue ownership is visible in the acceptance contract', 'The original connection does not wait for provider latency'] },
      { dot: 'orange', title: 'Bounded Recovery', items: ['Timeouts re-enter the queue with a retry policy', 'Final state is persisted before notification', 'The job store remains the source of truth'] },
      { dot: 'emerald', title: 'Two Observation Paths', items: ['A signed webhook announces completion', 'Status polling is a fallback, not a second workflow', 'Both paths converge on the same final state'] }
    ]
  },
  {
    id: 'cache-miss-sequence',
    schema_version: 1,
    diagram_type: 'sequence',
    meta: {
      title: 'Cache Miss Request Sequence',
      description: 'Read-through caching sequence separating user-facing low latency from asynchronous vector & audit logging.',
      layer: 'Infrastructure',
      views: [
        { id: 'request-and-auth', label: 'Request & Identity', focus: ['user', 'web', 'api', 'auth'], note: 'Follow the user request through the authentication check.' },
        { id: 'cache-fallback', label: 'Cache Fallback', focus: ['api', 'redis', 'db'], note: 'See the cache miss and the source-of-truth query it triggers.' },
        { id: 'return-and-trace', label: 'Return & Trace', focus: ['db', 'api', 'redis', 'trace', 'web', 'user'], note: 'Separate response latency from the non-blocking observability write.' }
      ]
    },
    participants: [
      { id: 'user', type: 'external', label: 'User', sublabel: 'Browser Session' },
      { id: 'web', type: 'frontend', label: 'Web App', sublabel: 'React Cockpit' },
      { id: 'api', type: 'backend', label: 'API', sublabel: 'Request Handler' },
      { id: 'auth', type: 'security', label: 'Auth', sublabel: 'JWT RBAC Verify' },
      { id: 'redis', type: 'database', label: 'Redis', sublabel: 'Cache Cluster' },
      { id: 'db', type: 'database', label: 'Postgres', sublabel: 'Second Brain DB' },
      { id: 'trace', type: 'messagebus', label: 'Trace', sublabel: 'Async OTLP Event' }
    ],
    messages: [
      { id: 'open-page', from: 'user', to: 'web', label: 'Open cockpit page', variant: 'default' },
      { id: 'dashboard-request', from: 'web', to: 'api', label: 'GET /api/v1/vaults/marketing', variant: 'emphasis' },
      { id: 'verify-jwt', from: 'api', to: 'auth', label: 'verify JWT & vault permission', variant: 'security' },
      { id: 'auth-claims', from: 'auth', to: 'api', label: 'claims OK (Role: ADMIN)', variant: 'return' },
      { id: 'cache-read', from: 'api', to: 'redis', label: 'read vault cache key', variant: 'default' },
      { id: 'cache-miss', from: 'redis', to: 'api', label: 'cache miss (null)', variant: 'return' },
      { id: 'profile-query', from: 'api', to: 'db', label: 'query PostgreSQL + vector rows', variant: 'emphasis' },
      { id: 'profile-rows', from: 'db', to: 'api', label: 'return verified rows', variant: 'return' },
      { id: 'cache-write', from: 'api', to: 'redis', label: 'set cache (TTL 300s)', variant: 'dashed' },
      { id: 'trace-emit', from: 'api', to: 'trace', label: 'emit telemetry trace', variant: 'dashed' },
      { id: 'dashboard-response', from: 'api', to: 'web', label: '200 OK JSON payload', variant: 'return' },
      { id: 'page-render', from: 'web', to: 'user', label: 'render UI components', variant: 'return' }
    ],
    cards: [
      { dot: 'emerald', title: 'Happy Path', items: ['The main request is Web App -> API -> data source -> response', 'Return messages are quieter than forward calls', 'Activation bars make ownership duration visible'] },
      { dot: 'rose', title: 'Policy + Fallback', items: ['JWT verification is colored as a security interaction', 'Cache miss is visible without overpowering the main path', 'Database access only appears after cache fallback'] },
      { dot: 'orange', title: 'Async Trace', items: ['Trace emission is dashed and secondary', 'It does not block the response path', 'The diagram separates user-facing latency from observability'] }
    ]
  },
  {
    id: 'deployment-release-lifecycle',
    schema_version: 1,
    diagram_type: 'lifecycle',
    meta: {
      title: 'Deployment Release Lifecycle',
      description: 'Immutable image promotion flow with automated verification, release owner approval gate, and zero-downtime rollback.',
      layer: 'Infrastructure',
      views: [
        { id: 'promotion-rail', label: 'Promotion Rail', focus: ['queued', 'building', 'verifying', 'ready', 'live'], note: 'Follow the deployment object from accepted change to healthy production.' },
        { id: 'approval-gate', label: 'Approval Gate', focus: ['verifying', 'approval', 'cancelled', 'ready'], note: 'Approval pauses promotion and can terminate the release cleanly.' },
        { id: 'rollback-outcomes', label: 'Rollback Outcomes', focus: ['ready', 'rollback', 'failed', 'live', 'paused', 'rolled_back'], note: 'Separate pre-promotion failure from post-promotion health regression.' }
      ]
    },
    lanes: [
      { id: 'main', label: 'Release phases' },
      { id: 'waiting', label: 'Approval + health wait' },
      { id: 'recovery', label: 'Rollback controller' },
      { id: 'terminal', label: 'Terminal exits' }
    ],
    states: [
      { id: 'queued', type: 'start', label: 'Queued', sublabel: 'change accepted', lane: 'main', col: 0, step: '01', tag: 'pending' },
      { id: 'building', type: 'active', label: 'Building', sublabel: 'immutable image', lane: 'main', col: 1, step: '02', tag: 'running' },
      { id: 'verifying', type: 'decision', label: 'Verifying', sublabel: 'tests + security scan', lane: 'main', col: 2, step: '03', tag: 'gate' },
      { id: 'ready', type: 'waiting', label: 'Ready', sublabel: 'promotion pending', lane: 'main', col: 3, step: '04', tag: 'approved' },
      { id: 'live', type: 'success', label: 'Live', sublabel: 'production healthy', lane: 'main', col: 4, step: '05', tag: 'success' },
      { id: 'approval', type: 'waiting', label: 'Needs Approval', sublabel: 'release owner gate', lane: 'waiting', col: 0, tag: 'pause' },
      { id: 'rollback', type: 'active', label: 'Rolling Back', sublabel: 'last good image', lane: 'recovery', col: 1, tag: 'automatic' },
      { id: 'paused', type: 'waiting', label: 'Health Paused', sublabel: 'SLO regression', lane: 'waiting', col: 2, tag: 'observe' },
      { id: 'cancelled', type: 'failure', label: 'Cancelled', sublabel: 'approval denied', lane: 'terminal', col: 0, tag: 'terminal' },
      { id: 'failed', type: 'failure', label: 'Failed', sublabel: 'rollback failed', lane: 'terminal', col: 1, tag: 'terminal' },
      { id: 'rolled_back', type: 'success', label: 'Rolled Back', sublabel: 'service restored', lane: 'terminal', col: 2, tag: 'terminal' }
    ],
    transitions: [
      { from: 'verifying', to: 'approval', variant: 'security', label: 'Production Promotion' },
      { from: 'approval', to: 'cancelled', variant: 'security', label: 'Denied' },
      { from: 'ready', to: 'rollback', variant: 'security', label: 'Pre-flight Failure' },
      { from: 'rollback', to: 'failed', variant: 'security', label: 'Controller Exception' },
      { from: 'live', to: 'paused', variant: 'dashed', label: 'Error Rate Spike' },
      { from: 'paused', to: 'rolled_back', variant: 'emphasis', label: 'Auto Rollback 100%' }
    ],
    cards: [
      { dot: 'cyan', title: 'Promotion Rail', items: ['The release object moves through five ordered phases', 'Verification and approval remain distinct states', 'Live means production health is currently proven'] },
      { dot: 'amber', title: 'Wait States', items: ['Human approval can pause without consuming a worker', 'A health regression pauses further rollout', 'Every wait exposes the event required to continue'] },
      { dot: 'rose', title: 'Explicit Endings', items: ['Denied approval ends as Cancelled', 'Rollback controller failure ends as Failed', 'Successful rollback is a terminal restored outcome'] }
    ]
  },
  {
    id: 'order-event-stream-topology',
    schema_version: 1,
    diagram_type: 'dataflow',
    meta: {
      title: 'Event-stream & Lead Ingest Topology',
      description: 'Partitioned event streaming with idempotent state processing, dead letter queue quarantine, and audited batch replay.',
      layer: 'Foundation',
      views: [
        { id: 'order-transit', label: 'Lead & Ingest Transit', focus: ['checkout', 'orders', 'validate', 'state', 'fulfillment'], note: 'Follow an intake event from producer through ordered processing to execution.' },
        { id: 'payment-transit', label: 'Conversion Transit', focus: ['billing', 'payments', 'enrich', 'state', 'analytics'], note: 'Track conversion facts into the shared materialized state and analytics.' },
        { id: 'failure-and-replay', label: 'Failure & Replay DLQ', focus: ['validate', 'enrich', 'dlq', 'replay', 'ops'], note: 'Isolate dead letters, operator review, and controlled replay ownership.' }
      ]
    },
    stages: [
      { label: 'Producers' },
      { label: 'Transit' },
      { label: 'Processors' },
      { label: 'State + Recovery' },
      { label: 'Consumers' }
    ],
    nodes: [
      { id: 'checkout', type: 'frontend', label: 'Intake Engine', sublabel: 'onboarding producer', stage: 0, row: 0, tag: 'team growth' },
      { id: 'billing', type: 'backend', label: 'CRM / Ads Webhook', sublabel: 'conversion producer', stage: 0, row: 2, tag: 'team data' },
      { id: 'orders', type: 'messagebus', label: 'intake.events.v1', sublabel: '12 partitions', stage: 1, row: 0, tag: 'key: client_id' },
      { id: 'payments', type: 'messagebus', label: 'conversions.v2', sublabel: '8 partitions', stage: 1, row: 2, tag: 'key: campaign_id' },
      { id: 'validate', type: 'backend', label: 'Intake Validator', sublabel: 'schema & vault router', stage: 2, row: 0, tag: 'ordered' },
      { id: 'enrich', type: 'backend', label: 'Attribution Enrich', sublabel: 'ROAS / CAC calculator', stage: 2, row: 2, tag: 'at-least-once' },
      { id: 'state', type: 'database', label: 'Second Brain State', sublabel: 'materialized vault view', stage: 3, row: 1, tag: 'idempotent' },
      { id: 'dlq', type: 'messagebus', label: 'events.dlq', sublabel: 'poison events', stage: 3, row: 4, tag: '7-day retention' },
      { id: 'fulfillment', type: 'backend', label: 'Agent Dispatcher', sublabel: 'autonomous task queue', stage: 4, row: 0, tag: 'consumer' },
      { id: 'analytics', type: 'database', label: 'Analytics Warehouse', sublabel: 'streaming facts', stage: 4, row: 2, tag: 'consumer' },
      { id: 'replay', type: 'security', label: 'Replay Tool', sublabel: 'approved batch', stage: 4, row: 4, tag: 'operator gate' },
      { id: 'ops', type: 'external', label: 'On-call SRE', sublabel: 'DLQ owner', stage: 4, row: 3, tag: 'SRE' }
    ],
    flows: [
      { from: 'checkout', to: 'orders', label: 'IntakeSubmitted', classification: 'schema v1', variant: 'emphasis' },
      { from: 'billing', to: 'payments', label: 'ConversionCaptured', classification: 'schema v2', variant: 'emphasis' },
      { from: 'orders', to: 'validate', label: 'ordered stream', classification: 'consumer group', variant: 'emphasis' },
      { from: 'payments', to: 'enrich', label: 'conversion facts', classification: 'at-least-once', variant: 'emphasis' },
      { from: 'validate', to: 'state', label: 'valid vault update', classification: 'idempotent', variant: 'emphasis' },
      { from: 'enrich', to: 'state', label: 'enriched metrics', classification: 'idempotent', variant: 'default' },
      { from: 'state', to: 'fulfillment', label: 'trigger agent task', classification: 'read model', variant: 'emphasis' },
      { from: 'state', to: 'analytics', label: 'growth facts', classification: 'non-PII', variant: 'default' },
      { from: 'validate', to: 'dlq', label: 'invalid payload', classification: 'dead letter', variant: 'security' },
      { from: 'enrich', to: 'dlq', label: 'poison event', classification: 'dead letter', variant: 'security' },
      { from: 'dlq', to: 'ops', label: 'alert & sample', classification: 'restricted', variant: 'security' },
      { from: 'dlq', to: 'replay', label: 'audited batch', classification: 'operator', variant: 'dashed' }
    ],
    cards: [
      { dot: 'amber', title: 'Transit Contract', items: ['Every event and topic is named', 'Partition keys preserve per-client ordering', 'Consumer groups expose processing ownership'] },
      { dot: 'emerald', title: 'State + Delivery', items: ['Processors write an idempotent materialized view', 'Agent dispatcher and analytics consume distinct assets', 'At-least-once delivery never implies duplicate business effects'] },
      { dot: 'rose', title: 'Failure Ownership', items: ['Poison events land in a retained dead-letter topic', 'On-call inspects samples before replay', 'Replay is gated, batched, and auditable'] }
    ]
  },
  {
    id: 'incident-response-runbook',
    schema_version: 1,
    diagram_type: 'workflow',
    meta: {
      title: 'Incident Response Runbook',
      description: 'Automated SLO burn rate detection, incident triage, containment, and verified recovery evidence protocol.',
      layer: 'Infrastructure',
      views: [
        { id: 'detect-and-triage', label: 'Detect & Establish Command', focus: ['alert', 'page', 'triage', 'declare'], note: 'Follow the first minutes from signal to an owned incident.' },
        { id: 'mitigate-and-verify', label: 'Mitigate & Prove Recovery', focus: ['triage', 'contain', 'recover', 'verify', 'close'], note: 'Keep mitigation separate from the evidence required to close.' },
        { id: 'escalate-and-communicate', label: 'Escalation & Communication', focus: ['declare', 'escalate', 'update', 'rollback'], note: 'See who is paged, what stakeholders hear, and when rollback begins.' }
      ]
    },
    lanes: [
      { id: 'signals', label: 'Signals' },
      { id: 'responders', label: 'Incident Command' },
      { id: 'mitigation', label: 'Service Mitigation' },
      { id: 'recovery', label: 'Recovery Evidence' },
      { id: 'communication', label: 'Stakeholder Communication' },
      { id: 'exceptions', label: 'Escalation + Rollback', variant: 'exception' }
    ],
    nodes: [
      { id: 'alert', lane: 'signals', col: 0, type: 'messagebus', label: 'SLO Alert', sublabel: 'burn rate > 2%' },
      { id: 'page', lane: 'responders', col: 1, width: 76, type: 'external', label: 'Page On-call', sublabel: 'acknowledge < 5m' },
      { id: 'triage', lane: 'responders', col: 2, width: 64, type: 'backend', label: 'Triage', sublabel: 'scope impact' },
      { id: 'declare', lane: 'responders', col: 3, type: 'security', label: 'Declare', sublabel: 'assign commander', tag: 'SEV-1/2' },
      { id: 'contain', lane: 'mitigation', col: 3, width: 72, type: 'backend', label: 'Contain', sublabel: 'circuit breaker' },
      { id: 'recover', lane: 'mitigation', col: 4, width: 52, type: 'cloud', label: 'Recover', sublabel: 'failover instance' },
      { id: 'verify', lane: 'recovery', col: 5, type: 'database', label: 'Verify', sublabel: 'SLO + traces', tag: '15 min stable' },
      { id: 'close', lane: 'communication', col: 5, type: 'external', label: 'Resolve', sublabel: 'post-mortem logged' },
      { id: 'update', lane: 'communication', col: 3, type: 'frontend', label: 'Status Update', sublabel: 'impact + ETA' },
      { id: 'escalate', lane: 'exceptions', col: 3, width: 72, type: 'security', label: 'Escalate', sublabel: 'database specialist' },
      { id: 'rollback', lane: 'exceptions', col: 5, type: 'messagebus', label: 'Rollback', sublabel: 'restore last good' }
    ],
    edges: [
      { from: 'alert', to: 'page', label: 'page on-call', variant: 'emphasis' },
      { from: 'page', to: 'triage', label: 'ack' },
      { from: 'triage', to: 'contain', variant: 'emphasis', label: 'mitigate' },
      { from: 'contain', to: 'recover', label: 'restore' },
      { from: 'recover', to: 'verify', variant: 'emphasis', label: 'health check' },
      { from: 'verify', to: 'close', variant: 'emphasis', label: 'SLO stable' },
      { from: 'triage', to: 'declare', variant: 'security', label: 'SEV rating' },
      { from: 'declare', to: 'update', variant: 'dashed', label: 'broadcast' },
      { from: 'update', to: 'escalate', variant: 'security', label: 'if unknown root cause' },
      { from: 'verify', to: 'rollback', variant: 'security', role: 'error', label: 'if SLO still failing' }
    ],
    cards: [
      { dot: 'rose', title: 'Ownership First', items: ['A page is not an incident until someone owns command', 'Severity and scope are explicit before mitigation spreads', 'Escalation names the missing expertise'] },
      { dot: 'emerald', title: 'Recovery Is Evidence', items: ['Mitigation can reduce impact without proving recovery', 'SLOs and traces must stay healthy for a fixed window', 'The final update follows verification, not optimism'] },
      { dot: 'cyan', title: 'Communication Contract', items: ['Stakeholders receive impact, action, and next update time', 'Rollback remains visible as a deliberate response', 'Every branch has an owner and observable exit'] }
    ]
  },
  {
    id: 'product-analytics-dataflow',
    schema_version: 1,
    diagram_type: 'dataflow',
    meta: {
      title: 'Product Analytics & RAG Data Flow',
      description: 'End-to-end telemetry streaming from client SDKs through PII consent vaults into feature stores and AI model ranking.',
      layer: 'Foundation',
      views: [
        { id: 'collection-path', label: 'Collection Path', focus: ['web', 'mobile', 'edge', 'stream'], note: 'Follow product events from clients into the ordered event stream.' },
        { id: 'consent-boundary', label: 'Consent & PII Vault', focus: ['edge', 'consent', 'pii'], note: 'Isolate the policy gate and restricted identity store.' },
        { id: 'analytics-consumers', label: 'Curated Consumers', focus: ['stream', 'warehouse', 'dashboard', 'features', 'model'], note: 'See curated facts, dashboards, and the derived feature path.' }
      ]
    },
    stages: [
      { label: 'Sources' },
      { label: 'Ingest' },
      { label: 'Process' },
      { label: 'Store' },
      { label: 'Consume' }
    ],
    nodes: [
      { id: 'web', type: 'frontend', label: 'Web Cockpit', sublabel: 'browser SDK', stage: 0, row: 0, tag: 'events' },
      { id: 'mobile', type: 'frontend', label: 'Mobile App', sublabel: 'iOS / Android SDK', stage: 0, row: 2, tag: 'events' },
      { id: 'edge', type: 'cloud', label: 'Edge API Gateway', sublabel: 'TLS collector', stage: 1, row: 1, tag: 'TLS :443' },
      { id: 'consent', type: 'security', label: 'Consent Gate', sublabel: 'policy filter', stage: 2, row: 0, tag: 'PII guard' },
      { id: 'stream', type: 'messagebus', label: 'Event Stream', sublabel: 'Kafka topic', stage: 2, row: 2, tag: 'ordered' },
      { id: 'pii', type: 'security', label: 'PII Vault', sublabel: 'encrypted AES-256', stage: 3, row: 0, tag: 'restricted' },
      { id: 'warehouse', type: 'database', label: 'Warehouse', sublabel: 'analytics tables', stage: 3, row: 2, tag: 'curated' },
      { id: 'features', type: 'database', label: 'Vector Feature Store', sublabel: 'pgvector embeddings', stage: 3, row: 4, tag: 'derived' },
      { id: 'dashboard', type: 'backend', label: 'Cockpit Dashboard', sublabel: 'real-time metrics', stage: 4, row: 1, tag: 'SQL' },
      { id: 'model', type: 'backend', label: 'Gemini Engine', sublabel: 'growth ranking model', stage: 4, row: 4, tag: 'features' }
    ],
    flows: [
      { from: 'web', to: 'edge', label: 'clickstream', classification: 'user events', variant: 'emphasis' },
      { from: 'mobile', to: 'edge', label: 'app events', classification: 'device events', variant: 'default' },
      { from: 'edge', to: 'consent', label: 'identity + consent', classification: 'PII touch', variant: 'security' },
      { from: 'edge', to: 'stream', label: 'accepted events', classification: 'append-only', variant: 'emphasis' },
      { from: 'consent', to: 'pii', label: 'encrypted identity map', classification: 'encrypted PII', variant: 'security' },
      { from: 'stream', to: 'warehouse', label: 'normalized facts', classification: 'non-PII', variant: 'emphasis' },
      { from: 'warehouse', to: 'features', label: 'daily embedding aggregates', classification: 'batch', variant: 'dashed' },
      { from: 'warehouse', to: 'dashboard', label: 'metrics SQL', classification: 'read-only', variant: 'default' },
      { from: 'features', to: 'model', label: 'context feature vectors', classification: 'derived', variant: 'dashed' },
      { from: 'pii', to: 'dashboard', label: 'restricted join (Admin only)', classification: 'approved only', variant: 'security' }
    ],
    cards: [
      { dot: 'emerald', title: 'Primary Data Path', items: ['Events move left to right through source, ingest, process, store, and consume stages', 'The hot path stays visually clear even with secondary batch flows', 'Labels name data assets instead of generic API verbs'] },
      { dot: 'rose', title: 'Sensitive Boundary', items: ['Consent and PII paths are styled as security flows', 'PII lands in a restricted vault, separate from the analytics warehouse', 'Restricted joins are visible without implying default access'] },
      { dot: 'orange', title: 'Derived Consumers', items: ['Dashboards read curated facts from the warehouse', 'Feature vectors are derived by batch from analytics tables', 'Consumption paths stay distinct from collection and consent handling'] }
    ]
  },
  {
    id: 'production-deployment-ownership',
    schema_version: 1,
    diagram_type: 'architecture',
    meta: {
      title: 'Production Deployment & Ownership Architecture',
      description: 'Physical network boundaries, multi-AZ API topology, encrypted PostgreSQL primary, and disaster recovery replica mapping.',
      layer: 'Infrastructure',
      views: [
        { id: 'request-boundary', label: 'Request Crosses the Edge', focus: ['clients', 'edge', 'gateway', 'api_a', 'api_b'], note: 'Follow public traffic into the private application network.' },
        { id: 'state-ownership', label: 'State & Ownership', focus: ['api_a', 'api_b', 'redis', 'postgres', 'replica'], note: 'Separate stateless platform workloads from data-team-owned state.' },
        { id: 'async-operations', label: 'Async & Operations', focus: ['api_b', 'events', 'worker', 'audit', 'observability'], note: 'See the asynchronous work and the evidence it emits.' }
      ]
    },
    components: [
      { id: 'clients', type: 'external', label: 'Customers', sublabel: 'Web + Mobile clients', tag: 'public' },
      { id: 'edge', type: 'cloud', label: 'Global Edge', sublabel: 'CDN + Cloud Armor WAF', tag: 'edge team' },
      { id: 'gateway', type: 'security', label: 'API Gateway', sublabel: 'mTLS Ingress :443', tag: 'platform team' },
      { id: 'api_a', type: 'backend', label: 'FastAPI Pods / AZ-a', sublabel: 'private subnet 10.0.1.0/24', tag: 'app team' },
      { id: 'api_b', type: 'backend', label: 'FastAPI Pods / AZ-b', sublabel: 'private subnet 10.0.2.0/24', tag: 'app team' },
      { id: 'redis', type: 'database', label: 'Redis Sentinel', sublabel: 'multi-AZ cache :6379', tag: 'platform team' },
      { id: 'postgres', type: 'database', label: 'PostgreSQL + pgvector', sublabel: 'primary encrypted (10 Vaults)', tag: 'data team' },
      { id: 'events', type: 'messagebus', label: 'Kafka Event Bus', sublabel: 'growth.events.v1', tag: 'platform team' },
      { id: 'worker', type: 'backend', label: 'Agent Workers', sublabel: 'autonomous task runners', tag: 'app team' },
      { id: 'replica', type: 'database', label: 'DR Replica DB', sublabel: 'cross-region hot standby', tag: 'data team' },
      { id: 'audit', type: 'cloud', label: 'Audit Archive', sublabel: 'WORM immutable objects', tag: 'security team' },
      { id: 'observability', type: 'external', label: 'Observability Stack', sublabel: 'Prometheus + OpenTelemetry', tag: 'SRE team' }
    ],
    connections: [
      { from: 'clients', to: 'edge', label: 'HTTPS :443', variant: 'emphasis' },
      { from: 'edge', to: 'gateway', label: 'mTLS verification', variant: 'security' },
      { from: 'gateway', to: 'api_a', label: 'internal VPC route', variant: 'emphasis' },
      { from: 'gateway', to: 'api_b', label: 'internal VPC route', variant: 'emphasis' },
      { from: 'api_a', to: 'redis', label: 'cache query', variant: 'default' },
      { from: 'api_b', to: 'postgres', label: 'SQL + pgvector RAG', variant: 'emphasis' },
      { from: 'api_a', to: 'events', label: 'publish intake event', variant: 'dashed' },
      { from: 'api_b', to: 'events', label: 'publish audit event', variant: 'dashed' },
      { from: 'events', to: 'worker', label: 'consume agent task', variant: 'emphasis' },
      { from: 'postgres', to: 'replica', label: 'cross-region WAL replication', variant: 'security' },
      { from: 'worker', to: 'audit', label: 'append immutable audit trail', variant: 'dashed' },
      { from: 'worker', to: 'observability', label: 'OTLP traces & metrics', variant: 'dashed' }
    ],
    cards: [
      { dot: 'cyan', title: 'Runtime Ownership', items: ['Platform owns the edge, gateway, cache, and event bus', 'Application teams own API pods and workers', 'Data owns primary and disaster-recovery state'] },
      { dot: 'rose', title: 'Named Crossings', items: ['Public HTTPS terminates at the managed edge', 'mTLS crosses into the application network', 'Cross-region WAL is explicit and encrypted'] },
      { dot: 'emerald', title: 'Operational Evidence', items: ['Workers emit traces to SRE-owned observability', 'Audit evidence lands in immutable storage', 'Unknown placement should remain marked, never invented'] }
    ]
  }
];
