import { Link } from "@remix-run/react";
import { useAccount } from "wagmi";

export default function NotFoundPage() {
  const { isConnected } = useAccount();

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-yellow-400">404</h1>
        <p className="mb-8 text-lg text-gray-300">Page not found</p>
        <div className="flex flex-col gap-4">
          <Link
            to={isConnected ? "/dashboard" : "/"}
            className="rounded-lg bg-yellow-400 px-6 py-3 text-black font-bold hover:bg-yellow-300 transition-colors"
          >
            Go back {isConnected ? "to dashboard" : "home"}
          </Link>
        </div>
      </div>
    </main>
  );
}
