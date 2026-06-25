import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getHermesState } from '@/lib/hermes-gateway';

type MarketingAsset = {
  id: string;
  title: string;
  type: 'outreach' | 'experiment' | 'prospects' | 'site' | 'product';
  source: string;
  summary: string;
  status: 'draft' | 'active' | 'review' | 'ready';
  agentId: string;
};

const STORE = join(process.cwd(), 'store');

function readStoreFile(file: string) {
  const path = join(STORE, file);
  return existsSync(path) ? readFileSync(path, 'utf-8') : '';
}

function summarize(text: string) {
  return text
    .split('\n')
    .map(line => line.trim().replace(/^#+\s*/, '').replace(/^- /, ''))
    .filter(Boolean)
    .slice(0, 2)
    .join(' ')
    .slice(0, 180);
}

export function getMarketingSnapshot() {
  const state = getHermesState();
  const files: Array<Omit<MarketingAsset, 'summary' | 'status' | 'agentId'>> = [
    { id: 'outreach-gov', title: 'Government outreach', type: 'outreach', source: 'store/outreach_gov.md' },
    { id: 'outreach-accounting', title: 'Accounting outreach', type: 'outreach', source: 'store/outreach_accounting.md' },
    { id: 'outreach-drafts', title: 'Outbound draft bank', type: 'outreach', source: 'store/outreach_drafts.md' },
    { id: 'experiment-1', title: 'Experiment 1 growth plan', type: 'experiment', source: 'store/experiment1_plan.md' },
    { id: 'experiment-2', title: 'Experiment 2 growth plan', type: 'experiment', source: 'store/experiment2_plan.md' },
    { id: 'experiment-3', title: 'Experiment 3 growth plan', type: 'experiment', source: 'store/experiment3_plan.md' },
  ];

  const assets = files
    .map(file => {
      const body = readStoreFile(file.source.replace('store/', ''));
      return {
        ...file,
        summary: body ? summarize(body) : 'No local asset found yet.',
        status: body ? 'active' : 'draft',
        agentId: file.type === 'experiment' ? 'albert' : 'operator',
      } satisfies MarketingAsset;
    });

  const prospectFiles = [
    'prospects_gov.json',
    'prospects_accounting.json',
    'prospects_lead_recovery.json',
    'prospects_scored.json',
  ].map(file => {
    const body = readStoreFile(file);
    let count = 0;
    try {
      const parsed = JSON.parse(body);
      count = Array.isArray(parsed) ? parsed.length : Array.isArray(parsed?.prospects) ? parsed.prospects.length : 0;
    } catch {}
    return {
      id: file.replace('.json', ''),
      title: file.replace('prospects_', '').replace('.json', '').replace(/_/g, ' '),
      type: 'prospects' as const,
      source: `store/${file}`,
      summary: count ? `${count} prospects available for outreach.` : 'Prospect list is ready for Hermes to update.',
      status: count ? 'ready' : 'draft',
      agentId: 'operator',
    } satisfies MarketingAsset;
  });

  const productAssets = state.products
    .filter(product => product.status !== 'removed')
    .map(product => ({
      id: product.id,
      title: product.title,
      type: product.type === 'site' ? 'site' : 'product',
      source: product.vercelUrl || product.downloadUrl || '/products',
      summary: product.description,
      status: product.status === 'published' ? 'active' : product.status === 'ready' ? 'ready' : 'review',
      agentId: 'albert',
    } satisfies MarketingAsset));

  const marketingTasks = state.tasks.filter(task => {
    const text = `${task.title} ${task.description || ''} ${task.project || ''}`.toLowerCase();
    return text.includes('marketing') || text.includes('content') || text.includes('launch') || text.includes('outreach') || text.includes('stripe');
  });

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      activeCampaigns: assets.filter(asset => asset.status === 'active').length,
      prospectLists: prospectFiles.length,
      productAssets: productAssets.length,
      openMarketingTasks: marketingTasks.filter(task => task.status !== 'done').length,
    },
    assets: [...assets, ...prospectFiles, ...productAssets],
    tasks: marketingTasks,
    recentEvents: state.events.filter(event => {
      const text = `${event.title} ${event.detail}`.toLowerCase();
      return text.includes('product') || text.includes('marketing') || text.includes('revenue') || text.includes('content');
    }).slice(0, 12),
  };
}
