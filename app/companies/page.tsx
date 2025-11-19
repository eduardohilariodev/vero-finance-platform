"use client";
import { useEffect, useState } from "react";
import { useDB } from "@/hooks/useDB";
import { Company } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENT_COMPANY_ID } from "@/lib/mocks";
import { v4 as uuid } from "uuid";
import Link from "next/link";

export default function CompaniesPage() {
  const { db } = useDB();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // New Company Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: "", email: "" });

  const fetchCompanies = async () => {
    if (!db) return;
    const all = await db.getAll("companies");
    // Filter out my own company
    setCompanies(all.filter((c) => c.id !== CURRENT_COMPANY_ID));
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    if (db) {
      (async () => {
        try {
          const all = await db.getAll("companies");
          if (isMounted) {
            setCompanies(all.filter((c) => c.id !== CURRENT_COMPANY_ID));
            setLoading(false);
          }
        } catch (error) {
          console.error("Error fetching companies:", error);
          if (isMounted) {
            setLoading(false);
          }
        }
      })();
    }

    return () => {
      isMounted = false;
    };
  }, [db]);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    const company: Company = {
      id: uuid(),
      name: newCompany.name,
      email: newCompany.email,
      walletAddress: `0x${Math.random().toString(16).slice(2, 42)}`, // Mock address
    };

    await db.add("companies", company);

    // Reset and refresh
    setNewCompany({ name: "", email: "" });
    setIsAdding(false);
    fetchCompanies();
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8">Loading directory...</div>;

  return (
    <div className="space-y-8 p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Company Directory</h1>
        <Button onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? "Cancel" : "Add Contact"}
        </Button>
      </div>

      {/* Add Company Form */}
      {isAdding && (
        <Card className="bg-gray-50 border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Add New Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleAddCompany}
              className="flex gap-4 items-end"
            >
              <div className="grid gap-2 flex-1">
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  required
                  value={newCompany.name}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, name: e.target.value })
                  }
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="grid gap-2 flex-1">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  required
                  type="email"
                  value={newCompany.email}
                  onChange={(e) =>
                    setNewCompany({ ...newCompany, email: e.target.value })
                  }
                  placeholder="billing@acme.com"
                />
              </div>
              <Button type="submit">Save Contact</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Companies List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCompanies.map((company) => (
          <Card
            key={company.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">
                  {company.name.substring(0, 2).toUpperCase()}
                </div>
                {company.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-900">Email:</span>{" "}
                  {company.email}
                </p>
                <p
                  className="truncate"
                  title={company.walletAddress}
                >
                  <span className="font-medium text-gray-900">Wallet:</span>{" "}
                  {company.walletAddress || "Not linked"}
                </p>
              </div>

              <div className="mt-4 flex gap-2 pt-2 border-t">
                {/* Note: In a full app, these would pre-fill the forms via query params */}
                <Link
                  href="/payments/send"
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    className="w-full text-xs h-8"
                  >
                    Send Money
                  </Button>
                </Link>
                <Link
                  href="/payments/request"
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    className="w-full text-xs h-8"
                  >
                    Request
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCompanies.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
            No companies found. Try adding one!
          </div>
        )}
      </div>
    </div>
  );
}
