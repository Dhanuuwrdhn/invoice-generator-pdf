'use client';

// Last-resort boundary so an unexpected server error shows a retry instead of Next's bare error page.
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
      <h1 className="text-lg font-semibold text-[#19261F]">Something went wrong</h1>
      <p className="text-sm text-[#5C6A5E]">Please try again. Your saved invoices are safe.</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-md bg-[#0B5C42] text-[#F6F7F1] font-mono text-[13px] font-bold hover:bg-[#094B36]"
      >
        TRY AGAIN
      </button>
    </main>
  );
}
