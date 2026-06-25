'use client';

import { useEffect, useMemo, useState } from 'react';
import TopBar from '@/components/TopBar';
import useIsMobile from '@/components/useIsMobile';

type StripeCustomer = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  totalRevenue: number;
  lastPaymentAt?: string;
  lastPaymentStatus?: string;
};

type StripeSnapshot = {
  connected: boolean;
  generatedAt: string;
  required?: string[];
  error?: string;
  setup?: { message: string };
  summary: {
    customerCount: number;
    payingCustomers: number;
    grossRevenue: number;
    successfulPayments: number;
    currency: string;
  };
  customers: StripeCustomer[];
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function formatDate(value?: string) {
  if (!value) return 'No payment yet';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CustomersPage() {
  const isMobile = useIsMobile();
  const [snapshot, setSnapshot] = useState<StripeSnapshot | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/summary', { cache: 'no-store' });
      setSnapshot(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const customers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (snapshot?.customers || []).filter(customer => {
      const matchesStatus = status === 'all' || customer.status === status;
      const matchesQuery = !q || `${customer.name} ${customer.email} ${customer.id}`.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [snapshot, query, status]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--background)' }}>
      <TopBar title="Customers" />
      <main style={{ flex: 1, width: '100%', maxWidth: 1180, margin: '0 auto', padding: isMobile ? 14 : 24 }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: 14, marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, color: '#fff', fontSize: 22 }}>Stripe CRM</h2>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Customers, revenue, and account status from Stripe.
            </p>
          </div>
          <button onClick={load} disabled={loading} style={{ background: 'var(--primary)', border: 'none', borderRadius: 8, padding: '9px 16px', color: '#fff', cursor: 'pointer', opacity: loading ? 0.65 : 1 }}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {!snapshot?.connected && (
          <div style={{ border: '1px solid rgba(245,158,11,0.45)', background: 'rgba(245,158,11,0.08)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 14 }}>Stripe needs one credential</div>
            <div style={{ color: 'var(--text)', fontSize: 13, marginTop: 5 }}>
              {snapshot?.setup?.message || 'Add STRIPE_SECRET_KEY to show live Stripe customers and revenue.'}
            </div>
            {snapshot?.error && <div style={{ color: '#fca5a5', fontSize: 12, marginTop: 6 }}>{snapshot.error}</div>}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: isMobile ? 8 : 12, marginBottom: 16 }}>
          <Metric label="Customers" value={String(snapshot?.summary.customerCount || 0)} tone="#a5b4fc" />
          <Metric label="Paying" value={String(snapshot?.summary.payingCustomers || 0)} tone="#10b981" />
          <Metric label="Revenue" value={money.format(snapshot?.summary.grossRevenue || 0)} tone="#38bdf8" />
          <Metric label="Payments" value={String(snapshot?.summary.successfulPayments || 0)} tone="#f59e0b" />
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10, marginBottom: 14 }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customers..."
            style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff', padding: '10px 12px', fontSize: 14 }}
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff', padding: '10px 12px', fontSize: 14 }}
          >
            <option value="all">All statuses</option>
            <option value="paying">Paying</option>
            <option value="lead">Leads</option>
            <option value="needs attention">Needs attention</option>
          </select>
        </div>

        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {isMobile ? (
            <div style={{ display: 'grid', gap: 0 }}>
              {customers.map(customer => <CustomerCard key={customer.id} customer={customer} />)}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'left' }}>
                    <th style={th}>Customer</th>
                    <th style={th}>Status</th>
                    <th style={th}>Total revenue</th>
                    <th style={th}>Last payment</th>
                    <th style={th}>Stripe ID</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => (
                    <tr key={customer.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={td}>
                        <div style={{ color: '#fff', fontWeight: 650 }}>{customer.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{customer.email || 'No email'}</div>
                      </td>
                      <td style={td}><StatusPill value={customer.status} /></td>
                      <td style={td}>{money.format(customer.totalRevenue)}</td>
                      <td style={td}>{formatDate(customer.lastPaymentAt)}</td>
                      <td style={{ ...td, color: 'var(--text-muted)', fontSize: 12 }}>{customer.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && customers.length === 0 && (
            <div style={{ padding: 26, color: 'var(--text-muted)', textAlign: 'center', fontSize: 13 }}>No Stripe customers match this view.</div>
          )}
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
      <div style={{ color: tone, fontSize: 24, fontWeight: 750 }}>{value}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const tone = value === 'paying' ? '#10b981' : value === 'needs attention' ? '#f59e0b' : '#94a3b8';
  return <span style={{ color: tone, background: `${tone}18`, border: `1px solid ${tone}55`, borderRadius: 999, padding: '4px 8px', fontSize: 12 }}>{value}</span>;
}

function CustomerCard({ customer }: { customer: StripeCustomer }) {
  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 650, fontSize: 14 }}>{customer.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{customer.email || customer.id}</div>
        </div>
        <StatusPill value={customer.status} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, color: 'var(--text)', fontSize: 13 }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Revenue</div>
          {money.format(customer.totalRevenue)}
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Last payment</div>
          {formatDate(customer.lastPaymentAt)}
        </div>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: '12px 14px', fontWeight: 650 };
const td: React.CSSProperties = { padding: '13px 14px', color: 'var(--text)', fontSize: 13, verticalAlign: 'middle' };
