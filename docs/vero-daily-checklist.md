# Vero Finance POC - Daily Implementation Checklist

Use this to track real-time progress. Check items off as you complete them.

---

## DAY 1 CHECKLIST

### Morning Session: Setup (8:00 AM - 10:00 AM)

**Bootstrap Phase:**
- [ ] `bunx shadcn@latest init` completed
  - [ ] TypeScript: yes
  - [ ] Tailwind: yes  
  - [ ] App Router: yes
  - [ ] ESLint: yes
- [ ] Project starts without errors: `bun run dev`
- [ ] Basic page renders at `http://localhost:3000`

**Dependencies Installed:**
- [ ] `bun add idb uuid`
- [ ] `bun add -d vitest @testing-library/react @testing-library/jest-dom jsdom`
- [ ] No install errors

**Project Structure Created:**
- [ ] `src/lib/` folder created
- [ ] `src/hooks/` folder created
- [ ] `src/app/dashboard/` folder created
- [ ] `src/app/payments/` folder created (send, request, accept subfolders)
- [ ] `src/app/funds/` folder created (add, withdraw subfolders)
- [ ] `src/app/companies/` folder created

---

### Mid-Morning Session: Data Layer (10:00 AM - 1:00 PM)

**Types File (`src/lib/types.ts`):**
- [ ] `Company` interface defined
- [ ] `Transaction` interface defined (with all 4 types)
- [ ] `PaymentRequest` interface defined
- [ ] `Wallet` interface defined
- [ ] File compiles without errors

**Database File (`src/lib/db.ts`):**
- [ ] `initDB()` function created
- [ ] All 4 object stores created (companies, transactions, paymentRequests, wallets)
- [ ] Indexes created for common queries
- [ ] Database initialization works in browser DevTools

**Mock Data (`src/lib/mocks.ts`):**
- [ ] `mockCompanies()` returns 3 test companies
- [ ] `mockWallet()` creates $10k starting balance
- [ ] `mockTransactions()` returns sample transactions
- [ ] `mockPaymentRequests()` returns sample requests
- [ ] `CURRENT_COMPANY_ID` constant defined

**Test Files Created:**
- [ ] `src/lib/balance.test.ts` created
- [ ] Test for starting balance passing ✓
- [ ] Test for deducting payments passing ✓
- [ ] Test for adding received payments passing ✓
- [ ] Test for ignoring pending transactions passing ✓
- [ ] `bun test` runs without errors

**Business Logic (`src/lib/balance.ts`):**
- [ ] `calculateBalance()` function implemented
- [ ] All tests passing: `bun test balance.test.ts`

---

### Afternoon Session: Database Hooks (1:00 PM - 3:30 PM)

**useDB Hook (`src/hooks/useDB.ts`):**
- [ ] Hook initializes database on mount
- [ ] Returns `{ db, loading, error }` tuple
- [ ] Handles cleanup to prevent memory leaks
- [ ] No errors in browser console when used

**useBalance Hook (`src/hooks/useBalance.ts`):**
- [ ] Hook fetches wallet and transactions
- [ ] Calculates balance using `calculateBalance()`
- [ ] Returns `{ balance, loading }`
- [ ] Updates when dependencies change
- [ ] Works with mock data

**Test All Hooks Together:**
- [ ] Create test component that uses both hooks
- [ ] Verify data loads correctly
- [ ] Verify balance displays correct value

---

### Late Afternoon Session: Dashboard (3:30 PM - 5:30 PM)

**Dashboard Page (`src/app/dashboard/page.tsx`):**
- [ ] Page imports useDB and useBalance
- [ ] Displays current balance in large format
- [ ] Shows recent transactions (last 5)
- [ ] Shows pending payment requests count
- [ ] 4 quick-action buttons render (Send, Request, Add, Withdraw)

**Dashboard Data Loading:**
- [ ] Balance loads from IndexedDB
- [ ] Recent transactions populate from db
- [ ] Pending requests populate from db
- [ ] No console errors
- [ ] Page layout is responsive (mobile & desktop)

**Navigation (`src/components/navigation.tsx`):**
- [ ] Navigation component created
- [ ] Links to Dashboard and Companies pages
- [ ] Added to root layout
- [ ] Navigation visible on all pages

**End-of-Day Testing:**
- [ ] `bun run dev` starts without errors
- [ ] Dashboard accessible at `/dashboard`
- [ ] Balance displays value
- [ ] Can see mock transactions
- [ ] All 4 action buttons visible
- [ ] No network errors in DevTools

---

## DAY 2 CHECKLIST

### Morning Session: Send Payment Flow (9:00 AM - 11:00 AM)

**Send Payment Page (`src/app/payments/send/page.tsx`):**
- [ ] Form renders with all fields:
  - [ ] Amount input
  - [ ] Currency dropdown (USDC, USD, ETH)
  - [ ] Recipient email input
  - [ ] Recipient company name input
  - [ ] Due date picker
- [ ] Form validation working:
  - [ ] Amount must be positive
  - [ ] Email is required
  - [ ] Required fields marked
- [ ] Submit button changes to "Processing..." while loading

**Send Payment Logic:**
- [ ] Recipient company lookup by email works
- [ ] New company created if doesn't exist
- [ ] Balance check implemented (can't send more than balance)
- [ ] Same-day payments processed immediately
- [ ] Future-dated payments scheduled (status: pending)
- [ ] Success message displays after sending
- [ ] Error messages display if validation fails

**Send Payment Persistence:**
- [ ] Transaction saved to IndexedDB
- [ ] Recipient gets matching received transaction
- [ ] Balance updates correctly
- [ ] Can see sent transaction in dashboard after redirect

---

### Late Morning Session: Request Payment Flow (11:00 AM - 12:30 PM)

**Request Payment Page (`src/app/payments/request/page.tsx`):**
- [ ] Form similar to Send Payment
- [ ] Fields: Amount, Currency, Recipient email, Recipient name, Due date
- [ ] No balance check (you're requesting, not sending)
- [ ] Success message after submitting

**Request Payment Logic:**
- [ ] Payment request saved to 'paymentRequests' store
- [ ] Status set to 'pending'
- [ ] Recipient company created if needed
- [ ] Request shows in dashboard as pending
- [ ] Email recipient would be notified (UI shows this will happen)

---

### Midday Session: Accept Payment Flow (12:30 PM - 2:00 PM)

**Accept Payment Page (`src/app/payments/accept/page.tsx`):**
- [ ] Page accepts requestId from URL params
- [ ] Loads payment request from IndexedDB
- [ ] Displays amount, due date, requesting company
- [ ] Shows current balance
- [ ] Two buttons: "Accept & Pay" and "Reject"

**Accept Logic:**
- [ ] "Accept" button creates outgoing transaction
- [ ] Creates incoming transaction for requester
- [ ] Updates payment request status to 'paid'
- [ ] Balance check prevents payment if insufficient funds
- [ ] Error message if balance too low
- [ ] Success message after acceptance

**Accept Payment Testing:**
- [ ] Can click on pending request from dashboard
- [ ] Successfully accept and pay request
- [ ] Balance decreases after acceptance
- [ ] Request status changes to 'paid'
- [ ] Both parties see correct transactions

---

### Afternoon Session: Add/Withdraw Flows (2:00 PM - 3:30 PM)

**Add Funds Page (`src/app/funds/add/page.tsx`):**
- [ ] Form with amount input and currency dropdown
- [ ] Type selector: Crypto or Bank Transfer
- [ ] Mock crypto deposit shows fake QR code
- [ ] Mock bank transfer shows fake bank details
- [ ] Submit creates 'deposit' transaction
- [ ] Transaction status: 'completed'
- [ ] Balance increases
- [ ] Success message displays

**Withdraw Funds Page (`src/app/funds/withdraw/page.tsx`):**
- [ ] Form with amount input and currency dropdown
- [ ] Destination selector: Crypto wallet or Bank account
- [ ] Shows withdrawal fee (mocked)
- [ ] Mock OTP verification screen (not real OTP)
- [ ] Submit creates 'withdrawal' transaction
- [ ] Transaction status: 'pending' (simulating approval)
- [ ] Balance decreases
- [ ] Success message displays

**Companies Page (`src/app/companies/page.tsx`):**
- [ ] Lists all companies in database
- [ ] Shows company name, email, wallet address
- [ ] Current company highlighted
- [ ] Mobile responsive

---

### Late Afternoon Session: Polish (3:30 PM - 4:30 PM)

**Loading States:**
- [ ] Dashboard shows "Loading..." while fetching data
- [ ] All forms show "Processing..." while submitting
- [ ] No race conditions if clicking buttons quickly

**Error Handling:**
- [ ] Form validation errors display
- [ ] Database errors caught and shown
- [ ] User can retry after error
- [ ] No console error spam

**UI/UX Polish:**
- [ ] All pages use shadcn components consistently
- [ ] Forms have proper spacing and alignment
- [ ] Buttons disabled while processing
- [ ] Success/error messages clear
- [ ] Mobile responsive on all pages
- [ ] No horizontal scrolling on mobile

**Final Testing:**
- [ ] `bun test` all tests passing
- [ ] `bun run build` completes without errors
- [ ] `bun run dev` starts clean
- [ ] Visit all 7 pages (dashboard, send, request, accept, add, withdraw, companies)
- [ ] Complete full flow:
  - [ ] View dashboard
  - [ ] Send payment
  - [ ] Check dashboard (balance down)
  - [ ] Receive payment request
  - [ ] Accept payment request
  - [ ] Add funds
  - [ ] Withdraw funds

---

## Critical Path (If Behind Schedule)

**If 6 PM Day 1 and Phase 2 incomplete:**
- Skip comprehensive mock data
- Use simpler stub data
- Move forward to Phase 3

**If 12 PM Day 2 and Payment flows incomplete:**
- Focus on Send Payment only
- Copy Send Payment for Request (minimal changes)
- Skip Accept Payment unless critical

**If 2 PM Day 2 and Add/Withdraw incomplete:**
- These are lower priority
- Focus on polish and testing what you have
- Can add in next iteration

---

## Before You Demo

**Checklist (4:00 PM Day 2):**
- [ ] Clear browser IndexedDB (right-click > inspect > storage)
- [ ] Refresh page
- [ ] Test complete user flow from scratch:
  1. [ ] Dashboard shows $10k balance
  2. [ ] Send $1,000 to test@example.com
  3. [ ] Check balance is now $9,000
  4. [ ] Add $5,000
  5. [ ] Check balance is now $14,000
  6. [ ] Create payment request
  7. [ ] Accept a payment request
  8. [ ] Check transaction history
- [ ] All pages load without errors
- [ ] No console errors (F12 → Console)
- [ ] Mobile layout responsive
- [ ] Forms submit without lag

---

## If You Finish Early (Bonus Work)

**30 min tasks:**
- [ ] Add transaction filtering by type
- [ ] Add date range filter for transactions
- [ ] Show transaction details modal
- [ ] Add company search/filter
- [ ] Transaction status badges (pending/completed)

**1 hour tasks:**
- [ ] Add stats dashboard (total sent, received, pending)
- [ ] Calculate fees and show in transactions
- [ ] Add OTP verification flow UI (mocked)
- [ ] Add confirmation dialog before paying
- [ ] Transaction export/download CSV

**2 hour tasks:**
- [ ] Add dark mode toggle
- [ ] Create settings page
- [ ] Add transaction search
- [ ] Create company detail page
- [ ] Add activity timeline view

---

## Critical Things NOT to Do

❌ Don't:
- Spend > 30 min on CSS styling (use defaults)
- Try to use real payment APIs (mock everything)
- Add authentication (assume logged in)
- Create database migrations (v1 = final)
- Set up environment variables (hardcode for POC)
- Optimize database queries (add indexes only if slow)
- Add animations (static UI only)
- Write integration tests (just core logic tests)

---

## Success Declaration

**Ship POC when:**
- ✅ Can complete full payment flow
- ✅ All 5 workflows accessible and functional
- ✅ Data persists in IndexedDB
- ✅ Balance calculations correct
- ✅ No critical bugs
- ✅ Ready for stakeholder demo

**Demo Script (5 minutes):**

1. "Here's the dashboard showing $10k starting balance"
2. "I send $1,000 payment to partner@example.com"
3. "System creates them as a company if new"
4. "Balance updates to $9,000 immediately"
5. "I request $500 from another vendor"
6. "I accept an incoming payment request"
7. "All transactions visible with history"
8. "Data persists - even if I close the browser and reopen"

**Time elapsed: 5 minutes. Everything is mocked and running locally.**

---

## Post-POC (Don't do now)

After stakeholders approve:
- Real blockchain integration
- Payment processor setup
- Email notifications
- Scheduled payment executor
- Multi-user support + auth
- Database migration to server
- Webhook handlers
- Admin dashboards
