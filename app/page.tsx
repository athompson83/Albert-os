'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  GitBranch,
  KeyRound,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react';
import useIsMobile from '@/components/useIsMobile';

type StatusData = {
  proxy: string;
  hermes?: { connected: boolean; lastUpdatedAt: string };
  agents: number;
  activeWorkflows: number;
  credentialsRequested?: number;
};

type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'review' | 'done';
  priority: 'high' | 'medium' | 'low';
  project?: string;
  requestKind?: 'general' | 'credential' | 'product_review' | 'approval';
  assignedTo?: 'adam' | 'hermes' | 'albert';
  archivedAt?: string;
  updatedAt?: string;
};

type Product = {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'ready' | 'needs_improvement' | 'removed' | 'published';
  type: 'pdf' | 'template' | 'site' | 'bundle';
  price?: string;
  downloadUrl?: string;
  vercelUrl?: string;
  updatedAt: string;
  comments: Array<{ id: string; author: string; text: string; createdAt: string }>;
};

type RevenueData = {
  revenue: { mrr: number; arr: number; total_earned: number };
  stripe?: {
    connected: boolean;
    summary: { customerCount: number; payingCustomers: number; grossRevenue: number; successfulPayments: number };
  };
};

type ExchangeLog = {
  id: string;
  timestamp: string;
  source: 'web' | 'hermes' | 'slack' | 'system' | 'stripe';
  kind: string;
  channel: string;
  actor: string;
  summary: string;
  relatedId?: string;
};

type WorkFilter = 'all' | 'tasks' | 'github' | 'products' | 'system';

const panel: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(20,34,48,0.92), rgba(13,25,36,0.92))',
  border: '1px solid rgba(93,121,148,0.32)',
  borderRadius: 8,
  boxShadow: '0 14px 40px rgba(0,0,0,0.22)',
};

const muted = '#9aa7b7';
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function timeAgo(value?: string) {
  if (!value) return 'just now';
  const diff = Math.max(1, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function priceNumber(value?: string) {
  const amount = Number(String(value || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
}

function sourceIcon(kind: string) {
  if (kind.includes('product')) return Package;
  if (kind.includes('task')) return CheckCircle2;
  if (kind.includes('credential')) return KeyRound;
  if (kind.includes('github')) return GitBranch;
  return Activity;
}

export default function Dashboard() {
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<StatusData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [logs, setLogs] = useState<ExchangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<WorkFilter>('all');
  const [actingId, setActingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [statusRes, tasksRes, productsRes, revenueRes, logsRes] = await Promise.all([
      fetch('/api/status', { cache: 'no-store' }).catch(() => null),
      fetch('/api/tasks', { cache: 'no-store' }).catch(() => null),
      fetch('/api/products', { cache: 'no-store' }).catch(() => null),
      fetch('/api/revenue', { cache: 'no-store' }).catch(() => null),
      fetch('/api/logs/exchanges?limit=40', { cache: 'no-store' }).catch(() => null),
    ]);

    if (statusRes?.ok) setStatus(await statusRes.json());
    if (tasksRes?.ok) {
      const data = await tasksRes.json();
      setTasks((data.tasks || []).filter((task: Task) => !task.archivedAt));
    }
    if (productsRes?.ok) {
      const data = await productsRes.json();
      setProducts((data.products || []).filter((product: Product) => product.status !== 'removed'));
    }
    if (revenueRes?.ok) setRevenue(await revenueRes.json());
    if (logsRes?.ok) {
      const data = await logsRes.json();
      setLogs(data.logs || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const openTasks = tasks.filter(task => task.status !== 'done');
  const credentialTasks = openTasks.filter(task => task.requestKind === 'credential');
  const approvals = openTasks.filter(task => task.requestKind === 'approval' || task.requestKind === 'product_review' || task.status === 'review');
  const productQueue = products.filter(product => product.status === 'draft' || product.status === 'ready' || product.status === 'needs_improvement').slice(0, 4);
  const topProducts = [...products].sort((a, b) => priceNumber(b.price) - priceNumber(a.price)).slice(0, 3);
  const comments = products.flatMap(product => product.comments.map(comment => ({ ...comment, product: product.title }))).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

  const workstream = useMemo(() => {
    const taskItems = openTasks.slice(0, 8).map(task => ({
      id: `task-${task.id}`,
      kind: 'task',
      title: task.status === 'review' ? 'Approval needed' : task.status === 'inprogress' ? 'Task in progress' : 'Task queued',
      detail: task.title,
      timestamp: task.updatedAt,
      href: `/tasks?task=${task.id}`,
      tag: task.id.slice(-6),
    }));
    const productItems = products.slice(0, 8).map(product => ({
      id: `product-${product.id}`,
      kind: 'product',
      title: product.status === 'published' ? 'Product published' : 'Product update',
      detail: product.title,
      timestamp: product.updatedAt,
      href: '/products',
      tag: product.status.replace('_', ' '),
    }));
    const logItems = logs.map(log => ({
      id: `log-${log.id}`,
      kind: log.kind,
      title: log.kind.replace(/_/g, ' '),
      detail: log.summary,
      timestamp: log.timestamp,
      href: log.channel === 'progress' ? '/progress' : log.channel === 'products' ? '/products' : '/logs',
      tag: log.source,
    }));
    return [...logItems, ...taskItems, ...productItems]
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .filter(item => {
        if (filter === 'all') return true;
        if (filter === 'tasks') return item.kind.includes('task') || item.kind.includes('credential');
        if (filter === 'products') return item.kind.includes('product');
        if (filter === 'github') return item.kind.includes('github');
        return item.kind.includes('status') || item.kind.includes('system') || item.kind.includes('stripe');
      })
      .slice(0, 10);
  }, [filter, logs, openTasks, products]);

  async function patchTask(task: Task, patch: Partial<Task>) {
    setActingId(task.id);
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, ...patch }),
      });
      await load();
    } finally {
      setActingId(null);
    }
  }

  const layout = isMobile
    ? { gridTemplateColumns: '1fr' }
    : { gridTemplateColumns: 'minmax(300px, 0.9fr) minmax(420px, 1.25fr) minmax(320px, 1fr)' };

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left, rgba(76,91,255,0.12), transparent 34%), #07111b', color: '#e7edf7', padding: isMobile ? 14 : 16 }}>
      <section style={{ ...panel, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, minmax(0, 1fr))', marginBottom: 12, overflow: 'hidden' }}>
        <StatusTile icon={ShieldCheck} label="Hermes Connected" value="v1.0.0" tone="#4ade80" active={Boolean(status?.hermes?.connected)} href="/hermes/bootstrap" />
        <StatusTile icon={Activity} label="API Health" value={status?.proxy === 'online' ? 'Healthy' : 'Checking'} tone="#7dd3fc" active={status?.proxy === 'online'} href="/progress" />
        <StatusTile icon={KeyRound} label="Credentials Needed" value={`${status?.credentialsRequested || credentialTasks.length} pending`} tone="#fbbf24" active={(status?.credentialsRequested || credentialTasks.length) > 0} href="/credentials" />
        <StatusTile icon={RefreshCw} label="Last Sync" value={timeAgo(status?.hermes?.lastUpdatedAt)} tone="#a5b4fc" active href="/logs" />
        <Link href="/progress" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#fff', padding: 14, borderLeft: isMobile ? 'none' : '1px solid rgba(93,121,148,0.28)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, border: '1px solid rgba(148,163,184,0.38)', borderRadius: 7, padding: '10px 16px', background: 'rgba(255,255,255,0.05)', fontSize: 13, fontWeight: 700 }}>
            <TrendingUp size={17} /> View Progress
          </span>
        </Link>
      </section>

      <section style={{ display: 'grid', ...layout, gap: 12 }}>
        <aside style={{ ...panel, padding: 14 }}>
          <PanelTitle title="Needs Adam" count={credentialTasks.length + approvals.length} />

          <Block title="Credential Requests" href="/credentials">
            {credentialTasks.slice(0, 3).map(task => (
              <ActionCard key={task.id} icon={KeyRound} title={task.title} detail={task.description || 'Needed by Hermes to keep work moving.'} meta={`Requested by ${task.project || 'Hermes'}`} button="Provide" href="/credentials" tone="#fbbf24" />
            ))}
            {credentialTasks.length === 0 && <EmptyLine text="No credentials waiting." />}
          </Block>

          <Block title="Approvals" href="/tasks">
            {approvals.slice(0, 3).map(task => (
              <div key={task.id} style={smallRowStyle}>
                <CircleAlert size={16} color="#9aa7b7" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{task.title}</div>
                  <div style={{ color: muted, fontSize: 11, marginTop: 3 }}>{task.project || 'Hermes'} / {timeAgo(task.updatedAt)}</div>
                </div>
                <button disabled={actingId === task.id} onClick={() => patchTask(task, { status: 'done' })} style={miniButton('#4ade80')}>
                  <CheckCircle2 size={14} /> Approve
                </button>
                <button disabled={actingId === task.id} onClick={() => patchTask(task, { status: 'todo' })} style={miniButton('#cbd5e1')}>
                  <X size={14} /> Reject
                </button>
              </div>
            ))}
            {approvals.length === 0 && <EmptyLine text="No approvals waiting." />}
          </Block>

          <Block title="Quick Actions">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <QuickAction icon={KeyRound} label="Add Credential" href="/credentials" />
              <QuickAction icon={Plus} label="Create Task" href="/tasks" />
              <QuickAction icon={Package} label="New Product" href="/products" />
              <QuickAction icon={MessageSquare} label="Open Chat" href="/chat" />
            </div>
          </Block>
        </aside>

        <section style={{ ...panel, padding: 14, minWidth: 0 }}>
          <PanelTitle title="Hermes Workstream" />
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', marginBottom: 10 }}>
            {(['all', 'tasks', 'github', 'products', 'system'] as WorkFilter[]).map(item => (
              <button key={item} onClick={() => setFilter(item)} style={{ ...tabStyle, background: filter === item ? 'rgba(91,108,255,0.22)' : 'rgba(255,255,255,0.04)', color: filter === item ? '#fff' : muted }}>
                {item}
              </button>
            ))}
          </div>
          <div style={{ border: '1px solid rgba(93,121,148,0.24)', borderRadius: 8, overflow: 'hidden' }}>
            {workstream.map(item => {
              const Icon = sourceIcon(item.kind);
              return (
                <Link key={item.id} href={item.href} style={{ textDecoration: 'none' }}>
                  <article style={{ display: 'grid', gridTemplateColumns: '42px minmax(0, 1fr) auto', gap: 12, padding: '13px 12px', borderBottom: '1px solid rgba(93,121,148,0.22)', color: '#e7edf7', alignItems: 'center' }}>
                    <Icon size={24} color={item.kind.includes('product') ? '#cbd5e1' : item.kind.includes('task') ? '#86efac' : '#93c5fd'} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: '#fff', fontSize: 13, fontWeight: 750, textTransform: item.title.length < 18 ? 'capitalize' : 'none' }}>{item.title}</div>
                      <div style={{ color: '#b5c0cf', fontSize: 12, marginTop: 3, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.detail}</div>
                    </div>
                    <div style={{ textAlign: 'right', color: muted, fontSize: 11 }}>
                      <span style={{ display: 'inline-block', color: '#a5b4fc', border: '1px solid rgba(165,180,252,0.22)', borderRadius: 999, padding: '2px 7px', marginBottom: 5 }}>{item.tag}</span>
                      <div>{timeAgo(item.timestamp)}</div>
                    </div>
                  </article>
                </Link>
              );
            })}
            {workstream.length === 0 && <EmptyLine text="No workstream items for this filter." />}
          </div>
          <Link href="/progress" style={{ display: 'block', width: 210, margin: '10px auto 0', textAlign: 'center', textDecoration: 'none', color: '#cbd5e1', border: '1px solid rgba(93,121,148,0.35)', borderRadius: 7, padding: '8px 12px', fontSize: 13 }}>
            View full timeline
          </Link>
        </section>

        <aside style={{ ...panel, padding: 14 }}>
          <PanelTitle title="Revenue Engine" />
          <Block title="Product Queue" href="/products">
            {productQueue.map(product => (
              <ProductQueueItem key={product.id} product={product} />
            ))}
            {productQueue.length === 0 && <EmptyLine text="Product queue is clear." />}
          </Block>

          <Block title="Top Products" href="/products">
            {topProducts.map(product => (
              <Link key={product.id} href="/products" style={{ ...smallRowStyle, textDecoration: 'none' }}>
                <ProductThumb product={product} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 750 }}>{product.title}</div>
                  <div style={{ color: '#7dd3fc', fontSize: 11, marginTop: 3 }}>Ready for storefront <ExternalLink size={11} /></div>
                </div>
                <strong style={{ color: '#86efac', fontSize: 16 }}>{product.price || money.format(0)}</strong>
              </Link>
            ))}
          </Block>

          <Block title="Recent Comments" href="/logs">
            {comments.map(comment => (
              <div key={comment.id} style={smallRowStyle}>
                <div style={{ width: 28, height: 28, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#6366f1', color: '#fff', fontSize: 11, fontWeight: 800 }}>
                  {comment.author.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{comment.author} <span style={{ color: muted, fontWeight: 500, marginLeft: 6 }}>{timeAgo(comment.createdAt)}</span></div>
                  <div style={{ color: '#b5c0cf', fontSize: 12, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comment.text}</div>
                </div>
              </div>
            ))}
            {comments.length === 0 && <EmptyLine text="No product comments yet." />}
          </Block>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <MiniMetric label="Stripe revenue" value={money.format(revenue?.stripe?.summary.grossRevenue || 0)} />
            <MiniMetric label="Customers" value={String(revenue?.stripe?.summary.customerCount || 0)} />
          </div>
        </aside>
      </section>

      <footer style={{ ...panel, marginTop: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, color: muted, fontSize: 12 }}>
        <span><span style={{ color: '#4ade80' }}>●</span> Albert OS connected to Hermes</span>
        <span>API: <span style={{ color: '#86efac' }}>{status?.proxy === 'online' ? 'Healthy' : loading ? 'Checking' : 'Offline'}</span></span>
        <span>Version 1.0.0</span>
      </footer>
    </main>
  );
}

function StatusTile({ icon: Icon, label, value, tone, active, href }: { icon: typeof Activity; label: string; value: string; tone: string; active: boolean; href: string }) {
  return (
    <Link href={href} style={{ display: 'grid', gridTemplateColumns: '38px minmax(0, 1fr)', gap: 12, alignItems: 'center', padding: '14px 18px', borderRight: '1px solid rgba(93,121,148,0.28)', textDecoration: 'none' }}>
      <Icon size={28} color={tone} />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: active ? tone : '#cbd5e1', fontWeight: 800, fontSize: 14 }}>
          {active && <span style={{ width: 8, height: 8, borderRadius: 999, background: tone, boxShadow: `0 0 16px ${tone}` }} />}
          {label}
        </div>
        <div style={{ color: muted, fontSize: 12, marginTop: 4 }}>{value}</div>
      </div>
    </Link>
  );
}

function PanelTitle({ title, count }: { title: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '2px 0 12px' }}>
      <h2 style={{ color: '#fff', fontSize: 18, margin: 0, fontWeight: 850 }}>{title}</h2>
      {typeof count === 'number' && count > 0 && <span style={{ background: '#a16207', color: '#fff', borderRadius: 999, padding: '3px 9px', fontSize: 12, fontWeight: 800 }}>{count}</span>}
    </div>
  );
}

function Block({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(93,121,148,0.24)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: 14, fontWeight: 800 }}>{title}</h3>
        {href && <Link href={href} style={{ color: '#a5b4fc', fontSize: 12, textDecoration: 'none' }}>View all</Link>}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>{children}</div>
    </section>
  );
}

function ActionCard({ icon: Icon, title, detail, meta, button, href, tone }: { icon: typeof KeyRound; title: string; detail: string; meta: string; button: string; href: string; tone: string }) {
  return (
    <div style={smallRowStyle}>
      <Icon size={22} color={tone} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>{title}</div>
        <div style={{ color: muted, fontSize: 12, lineHeight: 1.35 }}>{detail}</div>
        <div style={{ color: '#8290a3', fontSize: 11, marginTop: 8 }}>{meta}</div>
      </div>
      <Link href={href} style={{ background: '#5b5ff0', border: '1px solid #6d72ff', color: '#fff', borderRadius: 7, padding: '8px 12px', textDecoration: 'none', fontSize: 12, fontWeight: 800 }}>{button}</Link>
    </div>
  );
}

function QuickAction({ icon: Icon, label, href }: { icon: typeof KeyRound; label: string; href: string }) {
  return (
    <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e7edf7', textDecoration: 'none', background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(93,121,148,0.28)', borderRadius: 7, padding: '12px 10px', fontSize: 13, fontWeight: 750 }}>
      <Icon size={19} color="#818cf8" /> {label}
    </Link>
  );
}

function ProductQueueItem({ product }: { product: Product }) {
  const progress = product.status === 'ready' ? 80 : product.status === 'needs_improvement' ? 55 : product.status === 'published' ? 100 : 25;
  return (
    <Link href="/products" style={{ ...smallRowStyle, textDecoration: 'none' }}>
      <Package size={20} color="#94a3b8" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontSize: 13, fontWeight: 750 }}>{product.title}</div>
        <div style={{ color: product.status === 'needs_improvement' ? '#fbbf24' : '#93c5fd', fontSize: 11, marginTop: 3 }}>{product.status.replace('_', ' ')}</div>
      </div>
      <div style={{ width: 130 }}>
        <div style={{ color: muted, fontSize: 12, marginBottom: 5 }}>{progress}%</div>
        <div style={{ height: 7, borderRadius: 999, background: 'rgba(148,163,184,0.18)', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', borderRadius: 999, background: '#fbbf24' }} />
        </div>
      </div>
    </Link>
  );
}

function ProductThumb({ product }: { product: Product }) {
  const words = product.title.split(/\s+/).slice(0, 2).join('\n').toUpperCase();
  return (
    <div style={{ width: 58, height: 58, borderRadius: 7, background: 'linear-gradient(135deg, #3730a3, #0f766e)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 10, fontWeight: 900, textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.05, boxShadow: 'inset 0 0 28px rgba(255,255,255,0.15)' }}>
      {words}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid rgba(93,121,148,0.24)', borderRadius: 7, padding: 10, background: 'rgba(255,255,255,0.035)' }}>
      <div style={{ color: '#86efac', fontSize: 20, fontWeight: 850 }}>{value}</div>
      <div style={{ color: muted, fontSize: 11 }}>{label}</div>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <div style={{ color: muted, fontSize: 13, padding: '10px 4px' }}>{text}</div>;
}

const smallRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: 'rgba(15,27,39,0.72)',
  border: '1px solid rgba(93,121,148,0.23)',
  borderRadius: 7,
  padding: 10,
  color: '#e7edf7',
};

const tabStyle: React.CSSProperties = {
  border: '1px solid rgba(93,121,148,0.28)',
  borderRadius: 7,
  padding: '8px 14px',
  cursor: 'pointer',
  fontSize: 12,
  textTransform: 'capitalize',
};

function miniButton(color: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: `${color}16`,
    border: `1px solid ${color}55`,
    color,
    borderRadius: 7,
    padding: '7px 10px',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 750,
  };
}
