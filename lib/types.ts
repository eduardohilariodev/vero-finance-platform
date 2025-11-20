export interface Company {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
}

export interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "payment_sent" | "payment_received";
  amount: number;
  currency: string; // The currency of the transaction (e.g., "ETH", "EUR")
  exchangeRate?: number; // The value of 1 unit of 'currency' in USD at the time of tx
  fromCompanyId: string;
  toCompanyId?: string;
  status: "pending" | "completed" | "failed";
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
  status: "pending" | "accepted" | "rejected" | "paid";
  createdAt: Date;
}

export interface Wallet {
  companyId: string;
  balance: number; // Always in stable coin (USDC)
  currency: string;
  lastUpdated: Date;
}
