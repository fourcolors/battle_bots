import { Link } from "@remix-run/react";
import { usePrivy } from "@privy-io/react-auth";

export default function NotFoundPage() {
  const { logout, authenticated } = usePrivy();

  return (
    <main className="flex min-h-screen items-center justify-center bg-privy-light-blue p-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-800">404</h1>
        <p className="mb-8 text-lg text-gray-600">Page not found</p>
        <div className="flex flex-col gap-4">
          {!authenticated ? (
            <Link 
              to="/"
              className="rounded-lg bg-violet-600 px-6 py-3 text-white hover:bg-violet-700"
            >
              Go back home
            </Link>
          ) : (
            <button
              onClick={logout}
              className="rounded-lg bg-red-600 px-6 py-3 text-white hover:bg-red-700"
            >
              Log out
            </button>
          )}
        </div>
      </div>
    </main>
  );
} 