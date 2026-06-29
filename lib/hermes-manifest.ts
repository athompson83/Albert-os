import { getCapabilities, getCapabilitySummary } from '@/lib/capabilities';
import { getAppRequestsSnapshot } from '@/lib/app-requests';
import { getContentToolsSnapshot } from '@/lib/content-tools';
import { getDistributionSnapshot } from '@/lib/distribution';
import { getHermesState } from '@/lib/hermes-gateway';

export function buildHermesManifest() {
  const state = getHermesState();
  const openTasks = state.tasks.filter(task => !task.archivedAt && task.status !== 'done');
  const credentialTasks = openTasks.filter(task => task.requestKind === 'credential');
  const products = state.products.filter(product => product.status !== 'removed');
  const distribution = getDistributionSnapshot();
  const contentTools = getContentToolsSnapshot();
  const appRequests = getAppRequestsSnapshot();

  return {
    ok: true,
    service: 'Albert Hermes HTTP API',
    version: '1.0',
    connected: true,
    connectedAt: state.connectedAt,
    lastUpdatedAt: state.lastUpdatedAt,
    health: {
      agents: state.agents.length,
      openTasks: openTasks.length,
      credentialRequests: credentialTasks.length,
      workflows: state.workflows.length,
      enabledWorkflows: state.workflows.filter(workflow => workflow.enabled).length,
      products: products.length,
      productsReadyForReview: products.filter(product => product.status === 'ready' || product.status === 'needs_improvement').length,
      distributionConnected: distribution.connected,
      distributionPlatforms: distribution.total,
      contentToolJobs: contentTools.recentJobs.length,
      brandProfile: contentTools.brand.name,
      appRequestsQueued: appRequests.counts.queued,
      appRequestsBlocked: appRequests.counts.blocked,
      capabilities: getCapabilitySummary(),
    },
    endpoints: {
      chat: '/agent',
      chatApi: '/api/chat',
      chatStream: '/api/chat/stream',
      manifest: '/hermes',
      bootstrap: '/hermes/bootstrap',
      health: '/hermes/health',
      agents: '/hermes/agents',
      tasks: '/hermes/tasks',
      workflows: '/hermes/workflows',
      chats: '/hermes/chats',
      history: '/hermes/history',
      capabilities: '/hermes/capabilities',
      credentials: '/hermes/credentials',
      products: '/hermes/products',
      appRequests: '/hermes/app-requests',
      appRequestsApi: '/api/app-requests',
      appRequestsUi: '/apps',
      events: '/hermes/events',
      inbox: '/hermes/inbox',
      revenue: '/api/revenue',
      stripeSummary: '/api/stripe/summary',
      customers: '/customers',
      marketing: '/api/marketing',
      contentTools: '/hermes/content-tools',
      contentToolsApi: '/api/content-tools',
      contentToolsUi: '/content/tools',
      brandProfile: '/api/content-tools/brand',
      distribution: '/hermes/distribution',
      distributionApi: '/api/distribution',
      progress: '/api/progress',
      progressByAgent: '/api/progress?agent=albert',
      progressFeedback: '/api/progress/feedback',
      exchangeLogs: '/api/logs/exchanges',
      slackEvents: '/api/slack/events',
      slackCommands: '/api/slack/commands',
      status: '/api/status',
    },
    writeContracts: {
      taskUpdate: { method: 'PATCH', endpoint: '/hermes/tasks', required: ['id'] },
      credentialProvide: { method: 'POST', endpoint: '/hermes/credentials', required: ['key', 'label', 'value'] },
      distributionConnect: { method: 'POST', endpoint: '/api/distribution', required: ['platformId', 'credentials'] },
      productUpdate: { method: 'PATCH', endpoint: '/hermes/products', required: ['id'] },
      workflowCreate: { method: 'POST', endpoint: '/hermes/workflows', required: ['name'] },
      agentCreate: { method: 'POST', endpoint: '/hermes/agents', required: ['name'] },
      inboxUpdate: { method: 'POST', endpoint: '/hermes/inbox', required: ['title'] },
      liveChat: { method: 'POST', endpoint: '/api/chat/stream', required: ['message'], optional: ['agentId', 'attachments'] },
      appRequest: { method: 'POST', endpoint: '/hermes/app-requests', required: ['targetApp', 'title'], optional: ['instructions', 'requestType', 'priority', 'metadata'] },
      contentToolJob: { method: 'POST', endpoint: '/hermes/content-tools', required: ['kind'], optional: ['prompt', 'mode', 'sourceUrl', 'sourceFileName', 'transcript', 'content'] },
      brandProfile: { method: 'POST', endpoint: '/api/content-tools/brand', required: ['name'], optional: ['logoUrl', 'primaryColor', 'secondaryColor', 'accentColor', 'voice', 'audience', 'designNotes'] },
      progressFeedback: { method: 'POST', endpoint: '/api/progress/feedback', required: ['message'], optional: ['agentId', 'relatedId'] },
      logExchange: { method: 'POST', endpoint: '/api/logs/exchanges', required: ['summary'], optional: ['kind', 'source', 'channel', 'targetAgentId', 'payload'] },
      slackSlashCommand: { method: 'POST', endpoint: '/api/slack/commands', required: ['text'] },
    },
    capabilities: getCapabilities(),
    distribution: {
      connected: distribution.connected,
      total: distribution.total,
      platforms: distribution.platforms.map(platform => ({
        id: platform.id,
        name: platform.name,
        connected: platform.connection?.status === 'connected',
        accessAvailable: Boolean(platform.connection?.accessAvailable),
        updatedAt: platform.connection?.updatedAt,
      })),
    },
    appAccessPolicy: appRequests.policy,
    appRequests: {
      counts: appRequests.counts,
      recentRequests: appRequests.recentRequests.slice(0, 8),
      endpoints: appRequests.endpoints,
    },
    contentTools: {
      brand: contentTools.brand,
      providers: contentTools.providers,
      recentJobs: contentTools.recentJobs.slice(0, 5),
    },
    recentEvents: state.events.slice(0, 10),
  };
}
