import { getCapabilities, getCapabilitySummary } from '@/lib/capabilities';
import { getHermesState } from '@/lib/hermes-gateway';

export function buildHermesManifest() {
  const state = getHermesState();
  const openTasks = state.tasks.filter(task => !task.archivedAt && task.status !== 'done');
  const credentialTasks = openTasks.filter(task => task.requestKind === 'credential');
  const products = state.products.filter(product => product.status !== 'removed');

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
      capabilities: getCapabilitySummary(),
    },
    endpoints: {
      chat: '/agent',
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
      events: '/hermes/events',
      inbox: '/hermes/inbox',
      revenue: '/api/revenue',
      progress: '/api/progress',
      status: '/api/status',
    },
    writeContracts: {
      taskUpdate: { method: 'PATCH', endpoint: '/hermes/tasks', required: ['id'] },
      credentialProvide: { method: 'POST', endpoint: '/hermes/credentials', required: ['key', 'label', 'value'] },
      productUpdate: { method: 'PATCH', endpoint: '/hermes/products', required: ['id'] },
      workflowCreate: { method: 'POST', endpoint: '/hermes/workflows', required: ['name'] },
      agentCreate: { method: 'POST', endpoint: '/hermes/agents', required: ['name'] },
      inboxUpdate: { method: 'POST', endpoint: '/hermes/inbox', required: ['title'] },
    },
    capabilities: getCapabilities(),
    recentEvents: state.events.slice(0, 10),
  };
}
