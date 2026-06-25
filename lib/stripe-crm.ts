type StripeCustomer = {
  id: string;
  email?: string | null;
  name?: string | null;
  created?: number;
  currency?: string | null;
  delinquent?: boolean | null;
  metadata?: Record<string, string>;
};

type StripePaymentIntent = {
  id: string;
  amount?: number;
  amount_received?: number;
  currency?: string;
  status?: string;
  customer?: string | null;
  description?: string | null;
  receipt_email?: string | null;
  created?: number;
};

type StripeList<T> = {
  data?: T[];
};

export type StripeCrmCustomer = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  totalRevenue: number;
  lastPaymentAt?: string;
  lastPaymentStatus?: string;
};

function stripeMoney(amount = 0) {
  return amount / 100;
}

async function stripeFetch<T>(path: string): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured.');

  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${key}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Stripe API ${res.status}: ${body.slice(0, 180)}`);
  }

  return (await res.json()) as T;
}

export async function getStripeCrmSnapshot() {
  const configured = Boolean(process.env.STRIPE_SECRET_KEY);
  if (!configured) {
    return {
      connected: false,
      generatedAt: new Date().toISOString(),
      required: ['STRIPE_SECRET_KEY'],
      setup: {
        message: 'Add STRIPE_SECRET_KEY in Vercel and local .env to show Stripe customers and revenue.',
        endpoints: ['/api/stripe/summary', '/customers', '/revenue'],
      },
      summary: {
        customerCount: 0,
        payingCustomers: 0,
        grossRevenue: 0,
        successfulPayments: 0,
        currency: 'usd',
      },
      customers: [] as StripeCrmCustomer[],
      payments: [] as StripePaymentIntent[],
    };
  }

  try {
    const [customersResult, paymentsResult] = await Promise.all([
      stripeFetch<StripeList<StripeCustomer>>('/customers?limit=50'),
      stripeFetch<StripeList<StripePaymentIntent>>('/payment_intents?limit=100'),
    ]);

    const customers = customersResult.data || [];
    const payments = paymentsResult.data || [];
    const successfulPayments = payments.filter(payment => payment.status === 'succeeded');
    const revenueByCustomer = new Map<string, { total: number; last?: StripePaymentIntent }>();

    for (const payment of successfulPayments) {
      const customerId = payment.customer || payment.receipt_email || 'unknown';
      const current = revenueByCustomer.get(customerId) || { total: 0 };
      current.total += stripeMoney(payment.amount_received || payment.amount || 0);
      if (!current.last || (payment.created || 0) > (current.last.created || 0)) {
        current.last = payment;
      }
      revenueByCustomer.set(customerId, current);
    }

    const crmCustomers = customers.map(customer => {
      const revenue = revenueByCustomer.get(customer.id);
      const lastPayment = revenue?.last;
      return {
        id: customer.id,
        name: customer.name || customer.email || 'Unnamed customer',
        email: customer.email || '',
        status: customer.delinquent ? 'needs attention' : revenue ? 'paying' : 'lead',
        createdAt: customer.created ? new Date(customer.created * 1000).toISOString() : '',
        totalRevenue: revenue?.total || 0,
        lastPaymentAt: lastPayment?.created ? new Date(lastPayment.created * 1000).toISOString() : undefined,
        lastPaymentStatus: lastPayment?.status,
      } satisfies StripeCrmCustomer;
    });

    const grossRevenue = successfulPayments.reduce(
      (sum, payment) => sum + stripeMoney(payment.amount_received || payment.amount || 0),
      0,
    );

    return {
      connected: true,
      generatedAt: new Date().toISOString(),
      required: [] as string[],
      summary: {
        customerCount: customers.length,
        payingCustomers: crmCustomers.filter(customer => customer.totalRevenue > 0).length,
        grossRevenue,
        successfulPayments: successfulPayments.length,
        currency: successfulPayments[0]?.currency || payments[0]?.currency || 'usd',
      },
      customers: crmCustomers.sort((a, b) => b.totalRevenue - a.totalRevenue),
      payments: payments.slice(0, 20),
    };
  } catch (error) {
    return {
      connected: false,
      generatedAt: new Date().toISOString(),
      required: ['STRIPE_SECRET_KEY'],
      error: error instanceof Error ? error.message : String(error),
      summary: {
        customerCount: 0,
        payingCustomers: 0,
        grossRevenue: 0,
        successfulPayments: 0,
        currency: 'usd',
      },
      customers: [] as StripeCrmCustomer[],
      payments: [] as StripePaymentIntent[],
    };
  }
}
