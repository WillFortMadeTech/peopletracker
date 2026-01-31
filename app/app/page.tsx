"use client";

import { useEffect, useState } from "react";

interface Document {
  id: string;
  name: string;
  active: boolean;
}

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const res = await fetch("/api/documents");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setDocuments(data.documents);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load documents");
      } finally {
        setLoading(false);
      }
    }
    fetchDocuments();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center gap-8 py-16 px-8 bg-white dark:bg-black">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          SageTracker
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Documents from LocalStack DynamoDB
        </p>

        {loading && (
          <div className="text-zinc-500">Loading documents...</div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && documents.length === 0 && (
          <div className="text-zinc-500">No documents found</div>
        )}

        {!loading && !error && documents.length > 0 && (
          <div className="w-full space-y-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-medium text-black dark:text-zinc-50">
                      {doc.name}
                    </h2>
                    <p className="text-sm text-zinc-500">ID: {doc.id}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm ${
                      doc.active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {doc.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
