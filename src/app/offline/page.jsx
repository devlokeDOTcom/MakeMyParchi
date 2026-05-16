import Link from "next/link";

export const metadata = {
  title: "Offline | Make My Parchi",
};

export default function OfflinePage() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-4 p-6 text-center font-sans">
      <h1 className="text-xl font-semibold">You are offline</h1>
      <p className="text-sm text-black/60 max-w-md">
        This page is not available without a network connection yet. Open the
        invoice app from the home page if you have already used it while online —
        cached pages and your saved data in this browser should still work.
      </p>
      <Link
        className="text-sm font-medium text-primary underline underline-offset-4"
        href="/"
      >
        Go to home
      </Link>
    </div>
  );
}
