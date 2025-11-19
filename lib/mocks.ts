import { v4 as uuid } from "uuid";
import { Company, Wallet, Transaction, PaymentRequest } from "./types";

// Mock company (simulate logged-in user)
export const CURRENT_COMPANY_ID = "company-1";

export const mockCompanies = (): Company[] => [
  {
    id: CURRENT_COMPANY_ID,
    name: "My Company LLC",
    email: "finance@mycompany.com",
    walletAddress: "0x1234...abcd",
  },
  {
    id: "company-2",
    name: "Partner Inc",
    email: "accounting@partner.com",
    walletAddress: "0x5678...efgh",
  },
  {
    id: "company-3",
    name: "Vendor Corp",
    email: "billing@vendor.com",
    walletAddress: "0x9abc...ijkl",
  },
];

// Mock wallet with $10k starting balance
export const mockWallet = (companyId: string): Wallet => ({
  companyId,
  balance: 10_000,
  currency: "USDC",
  lastUpdated: new Date(),
});

// Mock recent transactions
export const mockTransactions = (): Transaction[] => [
  {
    id: uuid(),
    type: "deposit",
    amount: 5000,
    currency: "USDC",
    fromCompanyId: "external",
    toCompanyId: CURRENT_COMPANY_ID,
    status: "completed",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    metadata: { description: "Initial deposit" },
  },
  {
    id: uuid(),
    type: "payment_sent",
    amount: 1500,
    currency: "USDC",
    fromCompanyId: CURRENT_COMPANY_ID,
    toCompanyId: "company-2",
    status: "completed",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
];

export const mockPaymentRequests = (): PaymentRequest[] => [
  {
    id: uuid(),
    fromCompanyId: "company-2",
    toCompanyId: CURRENT_COMPANY_ID,
    amount: 3000,
    currency: "USDC",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: "pending",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];
