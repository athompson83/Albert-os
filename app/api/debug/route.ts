import { NextResponse } from 'next/server';
import { getHermesRuntimeConfig, getHermesState } from '@/lib/hermes-gateway';

export const runtime = 'nodejs';

export async function GET() {
  const state = getHermesState();
  const stripeKey = process.env.STRIPE_SECRET_KEY || '';

  return NextResponse.json({
    hermes: getHermesRuntimeConfig(),
    stripe: {
      hasSecretKey: Boolean(stripeKey),
      keyMode: stripeKey.startsWith('sk_live_') ? 'live' : stripeKey.startsWith('sk_test_') ? 'test' : stripeKey ? 'unknown' : null,
      envKey: 'STRIPE_SECRET_KEY',
    },
    builtinGateway: {
      reachable: true,
      service: 'Albert Hermes HTTP API',
      endpoints: ['/agent', '/hermes/agents', '/hermes/tasks', '/hermes/workflows', '/hermes/chats', '/hermes/history', '/hermes/credentials', '/hermes/products', '/hermes/app-requests', '/hermes/events'],
      agents: state.agents.length,
      tasks: state.tasks.length,
      workflows: state.workflows.length,
      chats: state.chats.length,
      products: state.products.length,
      credentials: state.credentials.length,
      lastUpdatedAt: state.lastUpdatedAt,
    },
    env: Object.keys(process.env).filter(k => k.startsWith('ALBERT') || k.startsWith('HERMES') || k === 'STRIPE_SECRET_KEY'),
  });
}
