"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface SearchInputProps {
  defaultValue?: string;
}

export function SearchInput({ defaultValue = "" }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const qParam = searchParams.get("q") ?? "";
    setValue(qParam);
  }, [searchParams]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        if (newValue.trim().length > 0) {
          router.push(`/search?q=${encodeURIComponent(newValue.trim())}`);
        } else {
          router.push("/search");
        }
      }, 300);
    },
    [router]
  );

  const handleClear = useCallback(() => {
    setValue("");
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    router.push("/search");
  }, [router]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <svg
          className="h-5 w-5 text-cyber-text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search articles, transcripts..."
        className="w-full bg-cyber-surface border border-cyber-overlay rounded-lg py-3 pl-12 pr-12 text-cyber-text font-mono text-sm placeholder:text-cyber-text-secondary/50 focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-colors"
      />
      {value.length > 0 && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-cyber-text-secondary hover:text-cyber-text transition-colors"
          type="button"
          aria-label="Clear search"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
