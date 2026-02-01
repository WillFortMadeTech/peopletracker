"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function UsernameForm() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!username || !USERNAME_REGEX.test(username)) {
      setAvailable(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await fetch(
          `/api/profile/username?username=${encodeURIComponent(username)}`
        );
        const data = await res.json();
        setAvailable(data.available);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!USERNAME_REGEX.test(username)) {
      setError(
        "Username must be 3-20 characters and contain only letters, numbers, and underscores"
      );
      return;
    }

    if (available === false) {
      setError("Username already taken");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/profile/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to set username");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (!username) return null;
    if (!USERNAME_REGEX.test(username)) {
      return (
        <span className="text-red-600">
          3-20 characters, letters, numbers, underscores only
        </span>
      );
    }
    if (checking) return <span className="text-gray-500">Checking...</span>;
    if (available === true)
      return <span className="text-green-600">Available</span>;
    if (available === false)
      return <span className="text-red-600">Already taken</span>;
    return null;
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label
          htmlFor="username"
          className="mb-2 block text-sm font-medium text-black"
        >
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="johndoe"
          className="w-full border-2 border-black px-4 py-3 text-black placeholder-gray-400 focus:outline-none"
          autoComplete="off"
          autoFocus
        />
        <div className="mt-1 h-5 text-sm">{getStatusMessage()}</div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || checking || available === false}
        className="w-full border-2 border-black bg-black px-4 py-3 text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Setting up..." : "Continue"}
      </button>
    </form>
  );
}
