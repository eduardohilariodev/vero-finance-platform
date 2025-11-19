/**
 * Unit tests for useDB hook (mocking initDB)
 *
 * IMPORTANT: This test file requires jsdom environment (for React components).
 * Use: bun run test hooks/useDB.test.tsx
 */

// Import fake-indexeddb FIRST before any other imports that use IndexedDB
import "fake-indexeddb/auto";

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDB } from "./useDB";
import { VeroDb } from "@/lib/db";

// Mock initDB to have full control over the test
const mockInitDB = vi.fn();
vi.mock("@/lib/db", async () => {
  const actual = await vi.importActual("@/lib/db");
  return {
    ...actual,
    initDB: () => mockInitDB(),
  };
});

describe("useDB hook (unit tests)", () => {
  let mockDb: VeroDb;

  beforeEach(async () => {
    // Create a real database instance for mocking (using fake-indexeddb directly)
    // We need to import the actual initDB before the mock takes effect
    const { initDB: realInitDB } = await vi.importActual<
      typeof import("@/lib/db")
    >("@/lib/db");
    mockDb = await realInitDB();

    // Clear all stores
    await Promise.all([
      mockDb.clear("wallets"),
      mockDb.clear("transactions"),
      mockDb.clear("companies"),
      mockDb.clear("paymentRequests"),
    ]);

    // Reset mock
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Close database after each test
    if (mockDb) {
      mockDb.close();
    }
    vi.clearAllMocks();
  });

  it("should initialize with loading state", () => {
    // Mock initDB to return a promise that doesn't resolve immediately
    mockInitDB.mockReturnValue(
      new Promise(() => {}) // Never resolves, keeps loading
    );

    const { result } = renderHook(() => useDB());

    // Initially should be loading
    expect(result.current.loading).toBe(true);
    expect(result.current.db).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it("should initialize database on mount", async () => {
    // Mock initDB to resolve with database
    mockInitDB.mockResolvedValue(mockDb);

    const { result } = renderHook(() => useDB());

    // Wait for database to initialize
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Database should be ready
    expect(result.current.db).not.toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockInitDB).toHaveBeenCalledTimes(1);
  });

  it("should return database instance when ready", async () => {
    // Mock initDB to resolve with database
    mockInitDB.mockResolvedValue(mockDb);

    const { result } = renderHook(() => useDB());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Database should be a valid IDBPDatabase instance
    expect(result.current.db).toBeTruthy();
    expect(result.current.db?.objectStoreNames).toBeDefined();
    expect(result.current.db).toBe(mockDb);
  });

  it("should handle database initialization errors", async () => {
    // Mock initDB to reject with an error
    const error = new Error("Database initialization failed");
    mockInitDB.mockRejectedValue(error);

    const { result } = renderHook(() => useDB());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Should have error state
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe(
      "Database initialization failed"
    );
    expect(result.current.db).toBe(null);
    expect(mockInitDB).toHaveBeenCalledTimes(1);
  });

  it("should handle non-Error exceptions", async () => {
    // Mock initDB to reject with a string (not an Error object)
    mockInitDB.mockRejectedValue("String error");

    const { result } = renderHook(() => useDB());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Should convert to Error object
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe("String error");
    expect(result.current.db).toBe(null);
  });

  it("should clean up on unmount", async () => {
    // Mock initDB to resolve with database
    mockInitDB.mockResolvedValue(mockDb);

    const { result, unmount } = renderHook(() => useDB());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    const dbInstance = result.current.db;
    expect(dbInstance).not.toBe(null);

    // Unmount component
    unmount();

    // Database should still exist (we don't close it on unmount, just stop updates)
    // But the hook should not update state after unmount
    expect(dbInstance).toBeTruthy();
  });

  it("should not update state if component unmounts before initialization completes", async () => {
    // Mock initDB to resolve after a delay
    let resolveDb: (value: VeroDb) => void;
    const dbPromise = new Promise<VeroDb>((resolve) => {
      resolveDb = resolve;
    });
    mockInitDB.mockReturnValue(dbPromise);

    const { result, unmount } = renderHook(() => useDB());

    // Unmount immediately (before DB initializes)
    unmount();

    // Now resolve the promise (simulating DB initialization completing)
    resolveDb!(mockDb);

    // Wait a bit to ensure async operations would have completed
    await new Promise((resolve) => setTimeout(resolve, 100));

    // State should not have been updated (isMounted check prevents it)
    // This is tested implicitly - if the hook updated after unmount, we'd see errors
    expect(result.current.loading).toBe(true);
    expect(result.current.db).toBe(null);
  });

  it("should return correct tuple structure", async () => {
    // Mock initDB to resolve with database
    mockInitDB.mockResolvedValue(mockDb);

    const { result } = renderHook(() => useDB());

    // Check initial structure
    expect(result.current).toHaveProperty("db");
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("error");

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Check final structure
    expect(result.current).toHaveProperty("db");
    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("error");
  });

  it("should only call initDB once on mount", async () => {
    // Mock initDB to resolve with database
    mockInitDB.mockResolvedValue(mockDb);

    const { result, rerender } = renderHook(() => useDB());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Rerender should not trigger another initDB call
    rerender();

    await new Promise((resolve) => setTimeout(resolve, 100));

    // initDB should only be called once (on initial mount)
    expect(mockInitDB).toHaveBeenCalledTimes(1);
  });
});
