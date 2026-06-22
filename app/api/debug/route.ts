import { NextResponse } from 'next/server';
import { getHermesState } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET() {
  const state = getHermesState();

  return NextResponse.json({
    configuredGatewayUrl: process.env.ALBERT_GATEWAY_URL || null,
    builtinGateway: {
      reachable: true,
      service: 'Albert Hermes HTTP API',
      endpoints: ['/agent', '/hermes/agents', '/hermes/tasks', '/hermes/workflows', '/hermes/chats', '/hermes/history', '/hermes/credentials', '/hermes/products', '/hermes/events'],
      agents: state.agents.length,
      tasks: state.tasks.length,
      workflows: state.workflows.length,
      chats: state.chats.length,
      products: state.products.length,
      credentials: state.credentials.length,
      lastUpdatedAt: state.lastUpdatedAt,
    },
    env: Object.keys(process.env).filter(k => k.startsWith('ALBERT')),
  });
}
