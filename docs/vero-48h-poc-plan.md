# Vero Finance Platform - 48-Hour POC Action Plan

## Project Constraints & Principles

- **Speed is king**: Momentum over perfection
- **Mocked data everywhere**: No real blockchain/payment APIs until after POC
- **TDD where possible**: Write tests first for business logic, especially money calculations
- **Tech Stack**: Next.js 15 + shadcn/ui + IndexedDB + Vitest
- **No Auth**: User pre-authenticated (simplifies 6+ hours of work)
- **Scope**: Core UI flows + local data persistence + mocked API responses

---

## Phase 1: Setup (2 hours) - **DAY 1, 8:00 AM - 10:00 AM**

### 1.1 Project Bootstrap (30 min)

```bash
# Initialize project with shadcn
bunx shadcn@latest init

# Answer prompts:
# - New Next.js project
# - TypeScript: yes
# - Tailwind: yes
# - App Router: yes
# - ESLint: yes
```

**Why this order**: Fastest way to get a working, styled project is shadcn's CLI.

### 1.2 Core Dependencies (15 min)

```bash
bun add idb uuid
bun add -d vitest @testing-library/react @testing-library/jest-dom jsdom
```

**What you get**:

- `idb`: Promise-based IndexedDB wrapper (way better than raw API)
- `uuid`: For generating mock transaction IDs
- `vitest`: Jest-compatible, 10x faster tests
- Testing library: React component testing

### 1.3 Project Structure (15 min)

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── payments/
│   │   ├── send/page.tsx
│   │   ├── request/page.tsx
│   │   └── accept/page.tsx
│   ├── funds/
│   │   ├── add/page.tsx
│   │   └── withdraw/page.tsx
│   └── companies/
│       └── page.tsx
├── components/
│   ├── ui/          (shadcn components auto-generated)
│   ├── navigation.tsx
│   └── ...
├── lib/
│   ├── db.ts        (IndexedDB setup & schema)
│   ├── types.ts     (TypeScript interfaces)
│   ├── utils.ts     (shadcn utilities)
│   └── mocks.ts     (Mock data generators)
├── hooks/
│   ├── useDB.ts     (IndexedDB wrapper hook)
│   └── useBalance.ts
└── vitest.config.ts
```

---

## Phase 2: Data Layer Foundation (3 hours) - **DAY 1, 10:00 AM - 1:00 PM**

### 2.1 Type Definitions (30 min)

**File: `src/lib/types.ts`**

```typescript
// Core domain types (write these FIRST)
export interface Company {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment_sent' | 'payment_received';
  amount: number;
  currency: 'USD' | 'USDC' | 'ETH'; // Mocked currencies
  fromCompanyId: string;
  toCompanyId?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  scheduledFor?: Date;
  metadata?: {
    description?: string;
    requestId?: string;
    networkFee?: number;
  };
}

export interface PaymentRequest {
  id: string;
  fromCompanyId: string;
  toCompanyId: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'paid';
  createdAt: Date;
}

export interface Wallet {
  companyId: string;
  balance: number; // Always in stable coin (USDC)
  currency: string;
  lastUpdated: Date;
}
```

**Why first**: Everything else depends on these types. You'll catch bugs at compile time.

### 2.2 IndexedDB Setup (45 min)

**File: `src/lib/db.ts`**

```typescript
import { IDBPDatabase, openDB } from 'idb';
import { Company, Transaction, PaymentRequest, Wallet } from './types';

const DB_NAME = 'VeroFinanceDB';
const DB_VERSION = 1;

export type VeroDb = IDBPDatabase<{
  companies: Company;
  transactions: Transaction;
  paymentRequests: PaymentRequest;
  wallets: Wallet;
}>;

export async function initDB(): Promise<VeroDb> {
  return openDB<VeroDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Companies store
      if (!db.objectStoreNames.contains('companies')) {
        const companiesStore = db.createObjectStore('companies', { 
          keyPath: 'id' 
        });
        companiesStore.createIndex('email', 'email', { unique: true });
      }

      // Transactions store
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { 
          keyPath: 'id' 
        });
        txStore.createIndex('fromCompanyId', 'fromCompanyId');
        txStore.createIndex('toCompanyId', 'toCompanyId');
        txStore.createIndex('createdAt', 'createdAt');
      }

      // Payment Requests store
      if (!db.objectStoreNames.contains('paymentRequests')) {
        const reqStore = db.createObjectStore('paymentRequests', { 
          keyPath: 'id' 
        });
        reqStore.createIndex('fromCompanyId', 'fromCompanyId');
        reqStore.createIndex('toCompanyId', 'toCompanyId');
        reqStore.createIndex('status', 'status');
      }

      // Wallets store (1 per company)
      if (!db.objectStoreNames.contains('wallets')) {
        db.createObjectStore('wallets', { keyPath: 'companyId' });
      }
    },
  });
}

export { DB_NAME, DB_VERSION };
```

**Why IndexedDB over other options**:

- Browser API (offline-first requirement met)
- No external dependencies for storage
- Supports complex queries with indexes
- Perfect for POC scope

### 2.3 Mock Data Generator (45 min)

**File: `src/lib/mocks.ts`**

```typescript
import { v4 as uuid } from 'uuid';
import { Company, Wallet, Transaction, PaymentRequest } from './types';

// Mock company (simulate logged-in user)
export const CURRENT_COMPANY_ID = 'company-1';

export const mockCompanies = (): Company[] => [
  {
    id: CURRENT_COMPANY_ID,
    name: 'My Company LLC',
    email: 'finance@mycompany.com',
    walletAddress: '0x1234...abcd',
  },
  {
    id: 'company-2',
    name: 'Partner Inc',
    email: 'accounting@partner.com',
    walletAddress: '0x5678...efgh',
  },
  {
    id: 'company-3',
    name: 'Vendor Corp',
    email: 'billing@vendor.com',
    walletAddress: '0x9abc...ijkl',
  },
];

// Mock wallet with $10k starting balance
export const mockWallet = (companyId: string): Wallet => ({
  companyId,
  balance: 10000,
  currency: 'USDC',
  lastUpdated: new Date(),
});

// Mock recent transactions
export const mockTransactions = (): Transaction[] => [
  {
    id: uuid(),
    type: 'deposit',
    amount: 5000,
    currency: 'USDC',
    fromCompanyId: 'external',
    toCompanyId: CURRENT_COMPANY_ID,
    status: 'completed',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    metadata: { description: 'Initial deposit' },
  },
  {
    id: uuid(),
    type: 'payment_sent',
    amount: 1500,
    currency: 'USDC',
    fromCompanyId: CURRENT_COMPANY_ID,
    toCompanyId: 'company-2',
    status: 'completed',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
];

export const mockPaymentRequests = (): PaymentRequest[] => [
  {
    id: uuid(),
    fromCompanyId: 'company-2',
    toCompanyId: CURRENT_COMPANY_ID,
    amount: 3000,
    currency: 'USDC',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];
```

**Why mock data first**: Lets you build UI without waiting for APIs. You can test all flows locally.

---

## Phase 3: Database Hook & Business Logic (2.5 hours) - **DAY 1, 1:00 PM - 3:30 PM**

### 3.1 Core Hook: useDB (1 hour)

**File: `src/hooks/useDB.ts`**

```typescript
'use client';
import { useEffect, useState } from 'react';
import { initDB, VeroDb } from '@/lib/db';

export function useDB() {
  const [db, setDb] = useState<VeroDb | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    initDB()
      .then((db) => {
        if (isMounted) {
          setDb(db);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { db, loading, error };
}
```

### 3.2 Business Logic: Balance Calculations (TDD) (45 min)

**File: `src/lib/balance.ts`** + **`src/lib/balance.test.ts`**

```typescript
// balance.ts - Write IMPLEMENTATION after tests

import { Transaction } from './types';

export function calculateBalance(
  initialBalance: number,
  transactions: Transaction[]
): number {
  return transactions.reduce((balance, tx) => {
    if (tx.status !== 'completed') return balance;
    
    // Debit: money out
    if (['payment_sent', 'withdrawal'].includes(tx.type)) {
      return balance - tx.amount;
    }
    
    // Credit: money in
    if (['payment_received', 'deposit'].includes(tx.type)) {
      return balance + tx.amount;
    }
    
    return balance;
  }, initialBalance);
}

// ====== Tests come first ======
// balance.test.ts

import { describe, it, expect } from 'vitest';
import { calculateBalance } from './balance';
import { Transaction } from './types';

describe('calculateBalance', () => {
  it('should start with initial balance', () => {
    const result = calculateBalance(10000, []);
    expect(result).toBe(10000);
  });

  it('should deduct payments sent', () => {
    const tx: Transaction = {
      id: '1',
      type: 'payment_sent',
      amount: 1000,
      currency: 'USDC',
      fromCompanyId: 'c1',
      status: 'completed',
      createdAt: new Date(),
    };
    expect(calculateBalance(10000, [tx])).toBe(9000);
  });

  it('should add received payments', () => {
    const tx: Transaction = {
      id: '1',
      type: 'payment_received',
      amount: 500,
      currency: 'USDC',
      toCompanyId: 'c1',
      status: 'completed',
      createdAt: new Date(),
    };
    expect(calculateBalance(10000, [tx])).toBe(10500);
  });

  it('should ignore pending transactions', () => {
    const tx: Transaction = {
      id: '1',
      type: 'payment_sent',
      amount: 1000,
      currency: 'USDC',
      fromCompanyId: 'c1',
      status: 'pending', // Not completed
      createdAt: new Date(),
    };
    expect(calculateBalance(10000, [tx])).toBe(10000);
  });
});
```

**Why TDD for balance**: Money math is non-negotiable. Tests catch rounding errors, pending vs completed logic, etc.

### 3.3 useBalance Hook (30 min)

**File: `src/hooks/useBalance.ts`**

```typescript
'use client';
import { useEffect, useState } from 'react';
import { useDB } from './useDB';
import { calculateBalance } from '@/lib/balance';
import { CURRENT_COMPANY_ID } from '@/lib/mocks';

export function useBalance(companyId: string = CURRENT_COMPANY_ID) {
  const { db } = useDB();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    (async () => {
      try {
        const wallet = await db.get('wallets', companyId);
        const txs = await db.getAllFromIndex(
          'transactions',
          'fromCompanyId',
          companyId
        );

        if (wallet) {
          const currentBalance = calculateBalance(wallet.balance, txs);
          setBalance(currentBalance);
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to load balance:', error);
        setLoading(false);
      }
    })();
  }, [db, companyId]);

  return { balance, loading };
}
```

---

## Phase 4: Dashboard Page (2 hours) - **DAY 1, 3:30 PM - 5:30 PM**

**File: `src/app/dashboard/page.tsx`**

This is your **MVP showcase page**. Show:

1. Current balance
2. Recent transactions (last 5)
3. Pending payment requests (count)
4. Quick-action buttons (Send, Request, Withdraw, Add Funds)

```typescript
'use client';
import { useEffect, useState } from 'react';
import { useDB } from '@/hooks/useDB';
import { useBalance } from '@/hooks/useBalance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function Dashboard() {
  const { db, loading: dbLoading } = useDB();
  const { balance } = useBalance();
  const [transactions, setTransactions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    if (!db) return;

    (async () => {
      // Last 5 transactions
      const allTxs = await db.getAll('transactions');
      setTransactions(
        allTxs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5)
      );

      // Pending requests received
      const allReqs = await db.getAll('paymentRequests');
      setPendingRequests(
        allReqs.filter(r => r.status === 'pending' && r.toCompanyId === 'company-1')
      );
    })();
  }, [db]);

  if (dbLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8 p-8">
      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
        </CardHeader>
        <CardContent className="text-4xl font-bold">
          ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Link href="/payments/send">
          <Button className="w-full">Send Payment</Button>
        </Link>
        <Link href="/payments/request">
          <Button variant="outline" className="w-full">Request Payment</Button>
        </Link>
        <Link href="/funds/add">
          <Button variant="outline" className="w-full">Add Funds</Button>
        </Link>
        <Link href="/funds/withdraw">
          <Button variant="outline" className="w-full">Withdraw</Button>
        </Link>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Payment Requests ({pendingRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map(req => (
                <div key={req.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-semibold">${req.amount} {req.currency}</p>
                    <p className="text-sm text-gray-500">Due: {new Date(req.dueDate).toLocaleDateString()}</p>
                  </div>
                  <Link href={`/payments/accept?requestId=${req.id}`}>
                    <Button size="sm">Accept</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="capitalize font-medium">{tx.type.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <p className={tx.type.includes('sent') || tx.type === 'withdrawal' ? 'text-red-500' : 'text-green-500'}>
                  {tx.type.includes('sent') || tx.type === 'withdrawal' ? '-' : '+'}${tx.amount}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Phase 5: Core Payment Flows (4.5 hours) - **DAY 2, 9:00 AM - 1:30 PM**

### Order: Send Payment → Request Payment → Accept Payment

This order builds momentum because:

1. Send Payment is simplest (Sender has funds check → Schedule or send)
2. Request Payment reuses Send Payment logic
3. Accept Payment reuses both + adds complexity

### 5.1 Send Payment Page (1.5 hours)

**File: `src/app/payments/send/page.tsx`**

```typescript
'use client';
import { useState } from 'react';
import { useDB } from '@/hooks/useDB';
import { useBalance } from '@/hooks/useBalance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { v4 as uuid } from 'uuid';
import { CURRENT_COMPANY_ID } from '@/lib/mocks';

export default function SendPaymentPage() {
  const { db } = useDB();
  const { balance } = useBalance();
  const [formData, setFormData] = useState({
    amount: '',
    companyName: '',
    email: '',
    dueDate: new Date().toISOString().split('T')[0],
    currency: 'USDC',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setLoading(true);
    setError('');

    try {
      const amount = parseFloat(formData.amount);

      // Validation
      if (amount <= 0) throw new Error('Amount must be positive');
      if (!formData.email) throw new Error('Email is required');

      // Find or create recipient company
      let recipientCompany = await db.getFromIndex('companies', 'email', formData.email);
      if (!recipientCompany) {
        recipientCompany = {
          id: uuid(),
          name: formData.companyName || 'New Company',
          email: formData.email,
        };
        await db.add('companies', recipientCompany);
      }

      const dueDate = new Date(formData.dueDate);
      const isToday = new Date().toDateString() === dueDate.toDateString();

      // Check if scheduled or immediate
      if (isToday && amount <= balance) {
        // Send immediately
        const txId = uuid();
        await db.add('transactions', {
          id: txId,
          type: 'payment_sent',
          amount,
          currency: formData.currency,
          fromCompanyId: CURRENT_COMPANY_ID,
          toCompanyId: recipientCompany.id,
          status: 'completed',
          createdAt: new Date(),
          metadata: { description: 'Payment' },
        });

        // Add corresponding received transaction for recipient
        await db.add('transactions', {
          id: uuid(),
          type: 'payment_received',
          amount,
          currency: formData.currency,
          fromCompanyId: CURRENT_COMPANY_ID,
          toCompanyId: recipientCompany.id,
          status: 'completed',
          createdAt: new Date(),
        });

        setSuccess(true);
      } else if (!isToday) {
        // Schedule for later
        const txId = uuid();
        await db.add('transactions', {
          id: txId,
          type: 'payment_sent',
          amount,
          currency: formData.currency,
          fromCompanyId: CURRENT_COMPANY_ID,
          toCompanyId: recipientCompany.id,
          status: 'pending',
          scheduledFor: dueDate,
          createdAt: new Date(),
        });
        setSuccess(true);
      } else {
        throw new Error('Insufficient balance for immediate payment');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xl font-bold text-green-600 mb-4">✓ Payment sent successfully!</p>
            <Button onClick={() => setSuccess(false)}>Send another</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Send Payment</CardTitle>
          <p className="text-sm text-gray-500 mt-2">Current balance: ${balance.toLocaleString()}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <Input
                type="number"
                step="0.01"
                placeholder="1000.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option>USDC</option>
                <option>USD</option>
                <option>ETH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Recipient Email</label>
              <Input
                type="email"
                placeholder="partner@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Recipient Company Name</label>
              <Input
                type="text"
                placeholder="Partner Inc"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Due Date</label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Processing...' : 'Send Payment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5.2 Request Payment Page (1.5 hours)

**File: `src/app/payments/request/page.tsx`**

Reuse most Send Payment form logic, but save as PaymentRequest instead of Transaction:

```typescript
// Similar to Send Payment, but:
// - Save to 'paymentRequests' store instead
// - Set status: 'pending'
// - No balance checks (you're requesting, not sending)
// - fromCompanyId = CURRENT_COMPANY_ID (you're requesting)
// - toCompanyId = recipient (they'll pay you)
```

### 5.3 Accept Payment Page (1.5 hours)

**File: `src/app/payments/accept/page.tsx`**

```typescript
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDB } from '@/hooks/useDB';
import { useBalance } from '@/hooks/useBalance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { v4 as uuid } from 'uuid';
import { CURRENT_COMPANY_ID } from '@/lib/mocks';

export default function AcceptPaymentPage() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');
  const { db } = useDB();
  const { balance } = useBalance();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    if (!db || !requestId) return;

    (async () => {
      try {
        const req = await db.get('paymentRequests', requestId);
        setRequest(req);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load request:', error);
        setLoading(false);
      }
    })();
  }, [db, requestId]);

  const handleAccept = async () => {
    if (!db || !request) return;
    setProcessing(true);

    try {
      const amount = request.amount;

      if (amount > balance) {
        throw new Error('Insufficient balance');
      }

      // Create outgoing transaction
      await db.add('transactions', {
        id: uuid(),
        type: 'payment_sent',
        amount,
        currency: request.currency,
        fromCompanyId: CURRENT_COMPANY_ID,
        toCompanyId: request.fromCompanyId,
        status: 'completed',
        createdAt: new Date(),
      });

      // Create incoming transaction for requester
      await db.add('transactions', {
        id: uuid(),
        type: 'payment_received',
        amount,
        currency: request.currency,
        fromCompanyId: CURRENT_COMPANY_ID,
        toCompanyId: request.fromCompanyId,
        status: 'completed',
        createdAt: new Date(),
      });

      // Update payment request status
      await db.put('paymentRequests', { ...request, status: 'paid' });

      setResult('success');
    } catch (error) {
      console.error('Failed to accept payment:', error);
      setResult('error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!db || !request) return;
    await db.put('paymentRequests', { ...request, status: 'rejected' });
    setResult('success');
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!request) return <div className="p-8">Request not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Payment Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {result === null ? (
            <>
              <div className="border rounded p-4 bg-blue-50">
                <p className="text-lg font-bold">${request.amount} {request.currency}</p>
                <p className="text-sm text-gray-600">Due: {new Date(request.dueDate).toLocaleDateString()}</p>
              </div>

              <p className="text-sm text-gray-600">
                Your current balance: ${balance.toLocaleString()}
              </p>

              <div className="flex gap-4">
                <Button
                  onClick={handleAccept}
                  disabled={processing || balance < request.amount}
                  className="flex-1"
                >
                  {processing ? 'Processing...' : 'Accept & Pay'}
                </Button>
                <Button
                  onClick={handleReject}
                  variant="destructive"
                  disabled={processing}
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            </>
          ) : result === 'success' ? (
            <div className="text-center py-8">
              <p className="text-xl font-bold text-green-600">✓ Done!</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xl font-bold text-red-600">✗ Error</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Phase 6: Remaining Flows (2 hours) - **DAY 2, 1:30 PM - 3:30 PM**

### 6.1 Add Funds Page (45 min)

**File: `src/app/funds/add/page.tsx`**

Simpler than Send Payment - just a form that deposits mocked amount:

```typescript
// Create transaction with type: 'deposit'
// No recipient needed (external deposit)
// Status: 'completed' (mock instant approval)
// Update wallet balance
```

### 6.2 Withdraw Funds Page (45 min)

**File: `src/app/funds/withdraw/page.tsx`**

Similar to Send:

```typescript
// Create transaction with type: 'withdrawal'
// Reduce balance
// Status: 'pending' (simulate pending approval)
// Show OTP verification UI (mocked - no real OTP)
```

### 6.3 Navigation Component (30 min)

**File: `src/components/navigation.tsx`**

```typescript
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navigation() {
  return (
    <nav className="border-b p-4 flex justify-between items-center">
      <Link href="/dashboard" className="font-bold text-xl">
        Vero Finance
      </Link>
      <div className="flex gap-4">
        <Link href="/dashboard">
          <Button variant="ghost">Dashboard</Button>
        </Link>
        <Link href="/companies">
          <Button variant="ghost">Companies</Button>
        </Link>
      </div>
    </nav>
  );
}
```

---

## Phase 7: Optional Polish (1 hour) - **DAY 2, 3:30 PM - 4:30 PM**

- Add loading skeletons
- Error boundaries
- Form validation messages
- Transaction filtering/sorting
- Companies page (view all companies)

---

## Day-by-Day Breakdown

### Day 1 (Wednesday)

| Time | Phase | Deliverable | Status |
|------|-------|-------------|--------|
| 8:00-10:00 | Setup | Next.js + shadcn bootstrapped, deps installed, folder structure ready | ✓ Momentum |
| 10:00-1:00 PM | Data Layer | Types, IndexedDB schema, mock data generators ready | ✓ Foundation |
| 1:00-3:30 PM | Business Logic | useDB, useBalance, balance calculation tests | ✓ Tested |
| 3:30-5:30 PM | Dashboard | Working POC page with balance, transactions, pending requests | ✓ Showable |

**End of Day 1: You have a working dashboard showing mocked data.**

### Day 2 (Thursday)

| Time | Phase | Deliverable | Status |
|------|-------|-------------|--------|
| 9:00 AM-1:30 PM | Core Flows | Send, Request, Accept payments fully working | ✓ Core features |
| 1:30-3:30 PM | Remaining | Add Funds, Withdraw, Navigation, Companies page | ✓ Complete |
| 3:30-4:30 PM | Polish | Loading states, error handling, UI refinements | ✓ Shippable |

**End of Day 2: Fully functional POC ready for demo.**

---

## Testing Strategy (TDD Checkpoint)

Write tests FIRST for these:

1. **Balance calculations** ✓ (Phase 3)
2. **Payment validation** (Phase 5 - can be skipped if time tight)
3. **Insufficient funds logic** (Phase 5 - can be skipped if time tight)

```bash
# Run tests continuously
bun test --watch
```

**Reality check**: If you're behind, skip tests for payment flows. You've tested the most critical part (balance math).

---

## Speed Hacks (Save 4+ hours)

1. **Use shadcn Button/Input/Card everywhere** - No custom CSS
2. **Mock all external APIs** - No payment processing setup
3. **Use IndexedDB directly for now** - No ORM needed
4. **Hardcode CURRENT_COMPANY_ID** - No auth/session logic
5. **Skip form validation beyond required/email** - Add later
6. **No animations** - Static UI only
7. **Don't optimize queries** - All data fits in browser

---

## Known Limitations of This POC

❌ **Not included** (add after POC validates):

- Real blockchain wallet integration
- OTP verification
- Payment scheduling with cron jobs
- Email notifications
- Multi-currency conversion
- Staking/yield generation
- API routes (everything client-side for now)
- Auth/user switching
- Analytics

✅ **Included**:

- Complete UI flows
- Local data persistence
- Transaction history
- Payment request workflows
- Balance calculations with tests
- Responsive design

---

## Success Criteria

At end of Day 2:

- [ ] Dashboard shows current balance
- [ ] Can send payment to existing/new company
- [ ] Can request payment from another company
- [ ] Can accept/reject incoming requests
- [ ] Can add funds (mock)
- [ ] Can withdraw funds (mock)
- [ ] All data persists in IndexedDB
- [ ] No external APIs called
- [ ] Runs on `bun run dev`
- [ ] Ready for stakeholder demo

---

## Commands Cheat Sheet

```bash
# Day 1 Setup
bunx shadcn@latest init
bun add idb uuid
bun add -d vitest @testing-library/react jsdom

# Run dev
bun run dev

# Run tests
bun test
bun test --watch

# Build (if needed)
bun run build
```

---

## Momentum Tips

✅ **Do this**:

- Finish Phase 1 before 10 AM Day 1
- Show dashboard by lunch Day 1
- Get Send Payment working by Day 2 noon
- Ship all 5 workflows by 3 PM Day 2

❌ **Avoid**:

- Perfectionist CSS - use defaults
- Real API integration - mock everything
- Complex state management - React hooks only
- Database migrations - v1 = final schema
- Environment configs - hardcoded is fine for POC
- Authentication - assume logged in

---

## Next Steps After POC (Don't do now)

1. Add real blockchain integration
2. Implement actual payment processor API
3. Add email notifications
4. Create scheduling system
5. Add authentication & multi-user support
6. Deploy to Vercel
7. Set up real database (if needed)
8. Payment webhook handlers
