# Vero Finance POC - Copy-Paste Code Starters

Use these exact code blocks to bootstrap your implementation. Start with Phase 1, then copy from the main plan.

---

## Phase 1 Setup - Commands

```bash
# Run these in order (copy-paste one at a time)

# 1. Initialize shadcn project
bunx shadcn@latest init

# Answer prompts:
# ? Would you like to use TypeScript? › (Y/n) - YES
# ? Which styling solution would you like to use? › tailwindcss
# ? Which color scheme would you like to use? › default
# ? Would you like to use CSS variables for colors? › (y/N) - YES
# ? Would you like to be using ESLint? › (y/N) - YES

# 2. Install core dependencies
bun add idb uuid

# 3. Install dev/test dependencies
bun add -d vitest @testing-library/react @testing-library/jest-dom jsdom

# 4. Verify everything works
bun run dev

# Visit http://localhost:3000 - you should see Next.js page
```

---

## Phase 2 - Types File

**File: `src/lib/types.ts`**

```typescript
// Copy-paste this entire file

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
  currency: 'USD' | 'USDC' | 'ETH';
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
  balance: number;
  currency: string;
  lastUpdated: Date;
}
```

---

## Phase 2 - Database Setup

**File: `src/lib/db.ts`**

```typescript
// Copy-paste this entire file

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
      if (!db.objectStoreNames.contains('companies')) {
        const companiesStore = db.createObjectStore('companies', { keyPath: 'id' });
        companiesStore.createIndex('email', 'email', { unique: true });
      }

      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('fromCompanyId', 'fromCompanyId');
        txStore.createIndex('toCompanyId', 'toCompanyId');
        txStore.createIndex('createdAt', 'createdAt');
      }

      if (!db.objectStoreNames.contains('paymentRequests')) {
        const reqStore = db.createObjectStore('paymentRequests', { keyPath: 'id' });
        reqStore.createIndex('fromCompanyId', 'fromCompanyId');
        reqStore.createIndex('toCompanyId', 'toCompanyId');
        reqStore.createIndex('status', 'status');
      }

      if (!db.objectStoreNames.contains('wallets')) {
        db.createObjectStore('wallets', { keyPath: 'companyId' });
      }
    },
  });
}

export { DB_NAME, DB_VERSION };
```

---

## Phase 2 - Mock Data

**File: `src/lib/mocks.ts`**

```typescript
// Copy-paste this entire file

import { v4 as uuid } from 'uuid';
import { Company, Wallet, Transaction, PaymentRequest } from './types';

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

export const mockWallet = (companyId: string): Wallet => ({
  companyId,
  balance: 10000,
  currency: 'USDC',
  lastUpdated: new Date(),
});

export const mockTransactions = (): Transaction[] => [
  {
    id: uuid(),
    type: 'deposit',
    amount: 5000,
    currency: 'USDC',
    fromCompanyId: 'external',
    toCompanyId: CURRENT_COMPANY_ID,
    status: 'completed',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
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
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

export const mockPaymentRequests = (): PaymentRequest[] => [
  {
    id: uuid(),
    fromCompanyId: 'company-2',
    toCompanyId: CURRENT_COMPANY_ID,
    amount: 3000,
    currency: 'USDC',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];
```

---

## Phase 3 - Balance Logic (Tests First!)

**File: `src/lib/balance.test.ts`** - WRITE THIS FIRST

```typescript
// Copy-paste this entire test file

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
      status: 'pending',
      createdAt: new Date(),
    };
    expect(calculateBalance(10000, [tx])).toBe(10000);
  });

  it('should handle multiple transactions', () => {
    const txs: Transaction[] = [
      {
        id: '1',
        type: 'deposit',
        amount: 5000,
        currency: 'USDC',
        fromCompanyId: 'external',
        toCompanyId: 'c1',
        status: 'completed',
        createdAt: new Date(),
      },
      {
        id: '2',
        type: 'payment_sent',
        amount: 1000,
        currency: 'USDC',
        fromCompanyId: 'c1',
        status: 'completed',
        createdAt: new Date(),
      },
      {
        id: '3',
        type: 'payment_received',
        amount: 500,
        currency: 'USDC',
        toCompanyId: 'c1',
        status: 'completed',
        createdAt: new Date(),
      },
    ];
    expect(calculateBalance(10000, txs)).toBe(14500);
  });
});
```

**Run tests:** `bun test`

**File: `src/lib/balance.ts`** - WRITE IMPLEMENTATION AFTER TESTS PASS

```typescript
// Copy-paste this entire file

import { Transaction } from './types';

export function calculateBalance(
  initialBalance: number,
  transactions: Transaction[]
): number {
  return transactions.reduce((balance, tx) => {
    if (tx.status !== 'completed') return balance;

    if (['payment_sent', 'withdrawal'].includes(tx.type)) {
      return balance - tx.amount;
    }

    if (['payment_received', 'deposit'].includes(tx.type)) {
      return balance + tx.amount;
    }

    return balance;
  }, initialBalance);
}
```

---

## Phase 3 - useDB Hook

**File: `src/hooks/useDB.ts`**

```typescript
// Copy-paste this entire file

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

---

## Phase 3 - useBalance Hook

**File: `src/hooks/useBalance.ts`**

```typescript
// Copy-paste this entire file

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

## Initialize Mock Data on First Load

**File: `src/app/layout.tsx`** - Add this to initialize mock data

```typescript
// Copy-paste the entire file and replace root layout

import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/navigation';
import { InitializeDB } from '@/components/initialize-db';

export const metadata: Metadata = {
  title: 'Vero Finance',
  description: 'Financial management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <InitializeDB />
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

**File: `src/components/initialize-db.tsx`** - Component that seeds mock data

```typescript
// Copy-paste this entire file

'use client';
import { useEffect } from 'react';
import { useDB } from '@/hooks/useDB';
import { mockCompanies, mockWallet, mockTransactions, mockPaymentRequests, CURRENT_COMPANY_ID } from '@/lib/mocks';

export function InitializeDB() {
  const { db } = useDB();

  useEffect(() => {
    if (!db) return;

    (async () => {
      try {
        // Check if already initialized
        const existing = await db.get('companies', CURRENT_COMPANY_ID);
        if (existing) return; // Already seeded

        // Seed companies
        const companies = mockCompanies();
        for (const company of companies) {
          await db.add('companies', company);
        }

        // Seed wallets
        for (const company of companies) {
          const wallet = mockWallet(company.id);
          await db.add('wallets', wallet);
        }

        // Seed transactions
        const transactions = mockTransactions();
        for (const tx of transactions) {
          await db.add('transactions', tx);
        }

        // Seed payment requests
        const requests = mockPaymentRequests();
        for (const req of requests) {
          await db.add('paymentRequests', req);
        }

        console.log('✓ Database initialized with mock data');
      } catch (error) {
        console.error('Failed to initialize DB:', error);
      }
    })();
  }, [db]);

  return null;
}
```

---

## Navigation Component

**File: `src/components/navigation.tsx`**

```typescript
// Copy-paste this entire file

'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navigation() {
  return (
    <nav className="border-b p-4 flex justify-between items-center bg-slate-50">
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

## First Test Run

After copying Phase 1-3 files:

```bash
# 1. Run tests to verify balance logic
bun test

# Expected output:
# ✓ src/lib/balance.test.ts (5 tests)
# All tests pass

# 2. Start dev server
bun run dev

# 3. Visit http://localhost:3000
# You should see "My Company LLC" loaded with $10k balance
```

---

## Quick Folder Creation Commands

```bash
# Create all folders at once
mkdir -p src/lib src/hooks src/app/dashboard src/app/payments/send src/app/payments/request src/app/payments/accept src/app/funds/add src/app/funds/withdraw src/app/companies src/components

# Verify structure
find src -type d | sort
```

---

## Next Steps

After getting Phase 1-3 working:

1. Use the main `vero-48h-poc-plan.md` for Phase 4+ (Dashboard, Payment flows)
2. Copy code snippets from sections 5.1-5.3 (Send, Request, Accept)
3. Use the `vero-daily-checklist.md` to track progress
4. Add shadcn components as needed: `bunx shadcn@latest add card button input`

---

## If You Get Stuck

**TypeScript Error: "Cannot find module"**

```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install
```

**IndexedDB Error in tests**

```bash
# Add to vitest.config.ts:
environment: 'jsdom'

# And import in test files:
import 'fake-indexeddb/auto'; // At top of test file
```

**Tests not running**

```bash
# Check vitest.config.ts exists
# Should be at project root after shadcn init

# Run specific test file
bun test src/lib/balance.test.ts
```

**Components not styled**

```bash
# Make sure you have shadcn initialized
bunx shadcn@latest init

# Add a specific component
bunx shadcn@latest add button card input
```

---

## That's it

You now have all the code to kickstart. Follow the timeline in the main plan file, check off the daily checklist, and ship the POC in 48 hours.

**Remember:**

- Copy-paste is faster than typing
- Mocked data is your friend
- Tests first for business logic
- Ship fast, iterate after
