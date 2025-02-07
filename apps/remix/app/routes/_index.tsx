import { MetaFunction } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useLogin } from "@privy-io/react-auth";
import Origin from "~/assets/origin.jpg";
import { PrivyClient } from "@privy-io/server-auth";

export const meta: MetaFunction = () => {
  return [
    { title: "Login · Privy" },
  ];
};

export const loader = async ({ request }) => {
  const cookieHeader = request.headers.get("Cookie");
  const cookieAuthToken = cookieHeader?.match(/privy-token=([^;]+)/)?.[1];

  if (!cookieAuthToken) return {};

  const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
  const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

  try {
    const claims = await client.verifyAuthToken(cookieAuthToken);
    // Use this result to pass props to a page for server rendering or to drive redirects!
    // ref https://nextjs.org/docs/pages/api-reference/functions/get-server-side-props
    console.log({ claims });

    return {
      props: {},
      redirect: { destination: "/dashboard", permanent: false },
    };
  } catch (error) {
    return { props: {} };
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useLogin({
    onComplete: () => navigate("/battle-bot-builder"),
  });

  return (
    <>
      <main className="flex min-h-screen min-w-full">
        <div className="flex bg-privy-light-blue flex-1 p-4 sm:p-6 justify-center items-center">
          <div className="flex flex-col items-center max-w-sm mx-auto w-full px-4">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Battle Bots</h1>
            <div className="mt-4 w-full">
              <button
                className="w-full bg-violet-600 hover:bg-violet-700 py-3 px-6 text-white rounded-lg"
                onClick={login}
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
