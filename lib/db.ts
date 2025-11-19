import { IDBPDatabase, openDB } from "idb";
import { Company, Transaction, PaymentRequest, Wallet } from "./types";

const DB_NAME = "VeroFinanceDB";
const DB_VERSION = 1;

type VeroDbSchema = {
  companies: Company;
  transactions: Transaction;
  paymentRequests: PaymentRequest;
  wallets: Wallet;
};

export type VeroDb = IDBPDatabase<VeroDbSchema>;

export async function initDB(): Promise<VeroDb> {
  return openDB<VeroDbSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Companies store
      if (!db.objectStoreNames.contains("companies")) {
        const companiesStore = db.createObjectStore("companies", {
          keyPath: "id",
        });
        companiesStore.createIndex("email", "email", { unique: true });
      }

      // Transactions store
      if (!db.objectStoreNames.contains("transactions")) {
        const txStore = db.createObjectStore("transactions", {
          keyPath: "id",
        });
        txStore.createIndex("fromCompanyId", "fromCompanyId");
        txStore.createIndex("toCompanyId", "toCompanyId");
        txStore.createIndex("createdAt", "createdAt");
      }

      // Payment Requests store
      if (!db.objectStoreNames.contains("paymentRequests")) {
        const reqStore = db.createObjectStore("paymentRequests", {
          keyPath: "id",
        });
        reqStore.createIndex("fromCompanyId", "fromCompanyId");
        reqStore.createIndex("toCompanyId", "toCompanyId");
        reqStore.createIndex("status", "status");
      }

      // Wallets store (1 per company)
      if (!db.objectStoreNames.contains("wallets")) {
        db.createObjectStore("wallets", { keyPath: "companyId" });
      }
    },
  });
}

export { DB_NAME, DB_VERSION };
