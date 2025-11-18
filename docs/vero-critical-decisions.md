# Vero Finance POC - Critical Decisions & When to Make Them

Quick reference for judgment calls that will keep you on pace.

---

## Decision 1: "Do I Need This Feature Now?"

**Ask this when you're tempted to add something beyond the spec:**

```
Is this feature in the README's 5 core workflows?
├─ YES → Build it
└─ NO → Skip it, add AFTER POC approval

Examples:
✓ Payment scheduling → Yes, in README
✓ OTP verification → Yes, mentioned in Withdraw
✗ Push notifications → No, not in README → Skip
✗ Detailed analytics → No, not in README → Skip
✗ Email integration → No, mentioned but not critical → Mock it
```

---

## Decision 2: "How Much Time Should I Spend on UI?"

**Time-boxing rule for design decisions:**

```
Button styling question? → Max 5 min
├─ Use shadcn defaults
└─ Move on

Layout decision? → Max 10 min
├─ Copy dashboard layout for all pages
└─ Done

Color/theme? → Max 15 min (total for entire POC)
├─ Use Tailwind defaults
└─ Call it done

TOTAL UI/UX TIME BUDGET: 60 minutes over 2 days
```

---

## Decision 3: "Should I Write a Test for This?"

**Use this matrix:**

```
Is it business logic involving money? → YES → Write test first
├─ Balance calculations
├─ Payment validation
├─ Fund checks
└─ Scheduling logic

Is it a React component? → MAYBE
├─ Dashboard page → NO, render-test only
├─ Form submit → NO, integration test only
└─ Custom hook logic → YES if logic-heavy

Is it a utility function? → YES
├─ Formatters
├─ Validators
├─ Calculations
└─ Transformers

RULE: "If money changes, test it."
```

---

## Decision 4: "Should I Use a Library or Write It?"

```
Do you need to persist data to browser? → IndexedDB via idb
Do you need UI components? → shadcn (don't remake buttons)
Do you need state management? → React hooks (not Redux)
Do you need form handling? → Native HTML forms (not React Hook Form)
Do you need date picking? → Native <input type="date">
Do you need routing? → Next.js App Router (built-in)
Do you need database? → IndexedDB (built-in, no server)
Do you need test runner? → Vitest (already installed)

RULE: "Use built-in or pre-installed only."
Nothing new unless absolutely necessary.
```

---

## Decision 5: "This Component is Getting Long. Should I Split It?"

```
If page file > 400 lines → Split it

But:
├─ Before splitting, ask: "Can I ship without splitting?"
├─ If YES → Keep it together (ship faster)
└─ If NO → Extract one sub-component, not ten

For POC:
- Keep dashboard as one file (easier to understand)
- Keep send payment as one file (easier to modify)
- OK to extract: repeated form fields (but only if reused 3+ times)

RULE: "If it works and fits on screen, don't refactor."
Refactor AFTER POC ships.
```

---

## Decision 6: "Should I Add Error Handling Here?"

```
User input validation? → YES
├─ Form field validation
├─ Email format check
└─ Amount > 0 check

Database errors? → YES
├─ Catch and show error message
└─ Allow retry

API errors? → NO (no real APIs in POC)

Edge cases? → NO for POC
├─ Handle in next iteration
└─ Focus on happy path

RULE: "Prevent bad data entry. Catch DB failures. Skip edge cases."
```

---

## Decision 7: "How Should I Handle State?"

```
Data from IndexedDB? → Use useState + useEffect
Do you need it across pages? → Use query params or localStorage (temporary)
Is it form state? → Use useState per form
Is it global? → NO (don't add Context/Redux for POC)
Is it a modal? → Use useState for open/closed

RULE: "Local state first. IndexedDB as 'server'. No global state store."
```

---

## Decision 8: "How Detailed Should My Mock Data Be?"

```
Use simple mocks:
- 3 test companies (not 100)
- 5 transactions (not complete history)
- Fixed $10k balance (not random)
- String IDs when possible (not realistic UUIDs)

BUT:
- Make sure mocks are REALISTIC enough to test logic
- Transaction amounts should vary ($500, $1000, $3000)
- Dates should be realistic (past, today, future)
- Emails should look real (name@company.com)

RULE: "Mock just enough to test all code paths."
```

---

## Decision 9: "Should I Build This Page or Skip It?"

```
Dashboard → BUILD (must showcase)
Send Payment → BUILD (core workflow)
Request Payment → BUILD (core workflow)
Accept Payment → BUILD (core workflow)
Add Funds → BUILD (core workflow)
Withdraw Funds → BUILD (core workflow)
Companies List → OPTIONAL (nice to have)
Company Detail → SKIP (not in README)
Settings → SKIP (not in README)
Admin Panel → SKIP (not in README)
Transaction Detail → OPTIONAL (nice to have)

RULE: "5 workflows + dashboard = required. Everything else is optional."
If behind, cut Companies page and Transaction Detail.
```

---

## Decision 10: "Is This Worth Caching?"

```
Should I cache database queries? → NO for POC
├─ Just fetch fresh each time
└─ Database is in browser (instant)

Should I cache form state? → NO for POC
├─ Just reset after submit
└─ User can re-type if needed

Should I cache navigation? → NO for POC
├─ Next.js handles it
└─ No need for extra optimizations

RULE: "No premature optimization. Ship first."
```

---

## Decision 11: "How Should I Deploy This?"

```
Before POC review → NO deployment needed
├─ Run locally with `bun run dev`
└─ Share screen for demo

After POC approval → Deploy to Vercel
├─ Connect GitHub repo
├─ Deploy on push
└─ Environment variables then

RULE: "Don't waste time on deployment for POC validation."
Focus on features working locally first.
```

---

## Decision 12: "I'm Behind Schedule. What Do I Cut?"

**Priority order (build in this order, cut from bottom):**

1. ✅ CRITICAL: Dashboard + Balance display (MUST HAVE)
2. ✅ CRITICAL: Send Payment flow (MUST HAVE)
3. ✅ CRITICAL: Request Payment flow (MUST HAVE)
4. ✅ CRITICAL: Accept Payment flow (MUST HAVE)
5. ⚠️ IMPORTANT: Add Funds flow (SHOULD HAVE)
6. ⚠️ IMPORTANT: Withdraw Funds flow (SHOULD HAVE)
7. ❌ OPTIONAL: Companies page (NICE TO HAVE)
8. ❌ OPTIONAL: Transaction detail views (NICE TO HAVE)
9. ❌ OPTIONAL: Polish/animations (NICE TO HAVE)

**If 6 PM Day 1 and not at #4:**

- Skip tests (except balance)
- Use simpler form validation
- Remove optional fields

**If 2 PM Day 2 and not at #6:**

- Skip Companies page
- Focus on polish instead
- Ship what you have

**If 3 PM Day 2 and haven't finished:**

- Declare MVP done
- Demo what exists
- Plan next phase

---

## Decision 13: "Should I Refactor This Code?"

```
During POC:
- NO refactoring
- Code doesn't need to be pretty
- Repetition is OK
- Long files are OK
- No design patterns needed

But if code causes bugs:
- Fix it immediately
- Make minimal change
- Move on

RULE: "Make it work. Make it right (after POC). Make it fast (iteration 2)."
```

---

## Decision 14: "What If Something Breaks?"

```
Database won't initialize?
├─ Clear IndexedDB in DevTools
├─ Refresh page
└─ Try again

Form won't submit?
├─ Check browser console for error
├─ Add console.log() to debug
└─ Verify db is loaded first

Balance showing wrong?
├─ Check calculateBalance function
├─ Verify transaction types match
└─ Test with simpler data

Random cryptic error?
├─ Try `bun install` again
├─ Try restarting `bun run dev`
└─ If still broken, git reset and restart

RULE: "Most issues are solved by restarting dev server + clearing cache."
```

---

## Decision 15: "How Do I Know When I'm Done?"

**Done when:**

- [ ] Dashboard loads without errors
- [ ] Can complete all 5 workflows
- [ ] Balance updates correctly
- [ ] No console errors
- [ ] Data persists after page refresh
- [ ] Can send/request/accept payments
- [ ] Can add/withdraw funds (mocked)
- [ ] Ready for 5-minute demo

**NOT done when:**

- Code isn't perfect (OK for POC)
- UI isn't beautiful (OK for POC)
- Tests aren't comprehensive (OK for POC)
- Performance isn't optimized (OK for POC)
- Every edge case handled (OK for POC)

---

## The 48-Hour Mindset

✅ **Embrace:**

- "Good enough" > Perfect
- Shipped > Polished
- Working > Beautiful
- Tested (critical logic) > 100% coverage
- Focused scope > Feature bloat

❌ **Avoid:**

- Perfectionism ("I'll refactor later")
- Scope creep ("Let me add one more feature")
- Premature optimization ("Let me cache this")
- Analysis paralysis ("Should I use X or Y?")
- Context switching ("Let me finish this other thing first")

---

## Decision Flowchart

```
Should I do this now?
    ↓
Is it in the 5 workflows or dashboard?
    ├─ YES → Do it
    └─ NO → Is it required to ship?
        ├─ YES → Do it
        └─ NO → Skip it (add after approval)

Is it getting complex?
    ├─ YES → Simplify or skip
    └─ NO → Proceed

Am I behind schedule?
    ├─ YES → Cut from optional list
    └─ NO → Continue

    ↓
    → BUILD IT (but don't over-engineer)
```

---

## When to Use the Main Plan

Use the detailed plan for:

- Exact code to write
- Timeline breakdowns
- Component structure
- File organization
- Test examples

Use this decisions document for:

- Quick judgment calls
- Time management
- Scope decisions
- Problem solving
- Momentum preservation

---

## Final Rule

> **"Done and shown is better than perfect and hidden."**

Make decisions fast. Move forward. Adjust after feedback.

The 48-hour POC isn't about building the final product.
It's about proving the concept works.

Ship it.
