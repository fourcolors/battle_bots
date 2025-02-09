import { Outlet } from "@remix-run/react";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "@remix-run/react";
import { useEffect } from "react";

export default function BattleBotBuilderLayout() {
  const { ready, authenticated } = usePrivy();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !authenticated) {
      navigate("/");
    }
  }, [ready, authenticated, navigate]);

  return (
    <div className="min-h-screen bg-black">
      <Outlet />
    </div>
  );
} 