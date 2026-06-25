import { buildHermesManifest } from '@/lib/hermes-manifest';
import { getHermesState } from '@/lib/hermes-gateway';

function withOrigin(origin: string, path: string) {
  if (path.startsWith('http')) return path;
  return `${origin.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildHermesBootstrap(origin = 'https://albert-os.vercel.app') {
  const manifest = buildHermesManifest();
  const state = getHermesState();
  const openTasks = state.tasks.filter(task => !task.archivedAt && task.status !== 'done');
  const credentialRequests = openTasks.filter(task => task.requestKind === 'credential');
  const productsForAction = state.products.filter(product => product.status === 'ready' || product.status === 'needs_improvement');

  return {
    ok: true,
    service: 'AlbertOS Hermes Bootstrap',
    generatedAt: new Date().toISOString(),
    app: {
      name: 'Albert OS',
      owner: 'Adam Thompson',
      purpose: 'Personal command center for Hermes work, revenue operations, digital products, credentials, tasks, progress, and app-generated outputs.',
      productionUrl: origin,
      localUrl: 'http://localhost:3001',
    },
    hermesFilesFound: [
      {
        path: 'work/OpenJarvis/src/openjarvis/evals/backends/external/hermes_agent.py',
        purpose: 'OpenJarvis adapter that launches Hermes Agent as a subprocess.',
      },
      {
        path: 'work/OpenJarvis/src/openjarvis/evals/backends/external/_runners/hermes_runner.py',
        purpose: 'Subprocess runner that imports run_agent.AIAgent from HERMES_AGENT_PATH and calls run_conversation.',
      },
      {
        path: 'work/OpenJarvis/src/openjarvis/evals/configs/framework_comparison/_third_party.toml',
        purpose: 'Declares Hermes path, pinned commit, runner script, and optional Python executable.',
      },
    ],
    discoveredHermesRequirements: {
      environment: ['HERMES_AGENT_PATH', 'HERMES_AGENT_PYTHON', 'JARVIS_BACKEND_BASE_URL', 'JARVIS_BACKEND_API_KEY'],
      pythonImport: 'from run_agent import AIAgent',
      runnerShape: {
        input: ['task', 'model', 'base_url', 'api_key', 'api_mode', 'max_iterations', 'system_prompt'],
        expectedOutput: ['final_response', 'messages', 'prompt_tokens', 'completion_tokens', 'total_tokens'],
      },
      note: 'No standalone Hermes Agent checkout was found under C:/Users/Adam during this pass; AlbertOS now exposes a complete host API for the connected Hermes process.',
    },
    instructionsForHermes: [
      'Read /hermes/bootstrap first, then /hermes for the current manifest.',
      'Use /hermes/tasks for Adam-facing tasks, approvals, and credential requests.',
      'Use /hermes/credentials to request or confirm credentials. Values sent by Adam are returned masked in UI state.',
      'Use /hermes/products to add, update, remove, or comment on digital products.',
      'Use /api/chat/stream for live Albert or agent conversations; pass agentId to talk to a specific agent.',
      'Use /api/progress?agent=albert, /api/progress?agent=operator, or /api/progress?agent=sentinelqa to filter work by agent.',
      'Use /api/progress/feedback to receive Adam feedback about progress; AlbertOS saves it to exchange logs and Hermes events.',
      'Use /api/logs/exchanges to read saved data exchanges. Product feedback, progress feedback, chat, Slack, Stripe syncs, and Hermes inbox updates are logged.',
      'Use /api/stripe/summary for Stripe CRM and revenue status. AlbertOS needs STRIPE_SECRET_KEY in the runtime environment.',
      'Use /api/marketing to see outreach, campaigns, prospect files, product assets, and revenue work.',
      'Use /hermes/inbox for general progress events or structured updates when no specialized endpoint fits.',
      'After any state-changing request, read /hermes/health or /api/status to confirm AlbertOS received the update.',
    ],
    environmentForFullConnection: {
      albertOS: ['STRIPE_SECRET_KEY', 'SLACK_SIGNING_SECRET', 'SLACK_BOT_TOKEN', 'SLACK_DEFAULT_CHANNEL_ID'],
      hermes: ['ALBERT_OS_BASE_URL=https://albert-os.vercel.app', 'ALBERT_OS_BOOTSTRAP_URL=https://albert-os.vercel.app/hermes/bootstrap'],
      slackApp: {
        eventRequestUrl: withOrigin(origin, '/api/slack/events'),
        slashCommandRequestUrl: withOrigin(origin, '/api/slack/commands'),
        recommendedBotScopes: ['app_mentions:read', 'chat:write', 'commands'],
      },
      stripe: {
        dashboardKey: 'STRIPE_SECRET_KEY',
        apiUsed: ['GET /v1/customers', 'GET /v1/payment_intents'],
      },
    },
    absoluteEndpoints: Object.fromEntries(
      Object.entries(manifest.endpoints).map(([key, path]) => [key, withOrigin(origin, path)]),
    ),
    writeContracts: manifest.writeContracts,
    currentState: {
      connected: manifest.connected,
      health: manifest.health,
      openTasks: openTasks.slice(0, 10),
      credentialRequests,
      productsForAction: productsForAction.slice(0, 12),
      recentEvents: state.events.slice(0, 20),
    },
  };
}
