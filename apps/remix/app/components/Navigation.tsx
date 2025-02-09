import { Identity } from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { Link, useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import { base } from "viem/chains";
import { useAccount } from "wagmi";

export function Navigation() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected) {
      navigate("/");
    }
  }, [isConnected, navigate]);

  if (!isConnected) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-900 border-b border-gray-800 px-4 py-3 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          to="/dashboard"
          className="text-2xl font-bold text-yellow-400 pixelated"
        >
          Battle Bots
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Dashboard
          </Link>

          <Wallet>
            <ConnectWallet>
              {address && (
                <Identity
                  address={address}
                  chain={base}
                  className="text-white flex items-center gap-2"
                >
                  <div>
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                </Identity>
              )}
            </ConnectWallet>
            {address && (
              <WalletDropdown>
                <Identity
                  address={address}
                  chain={base}
                  className="px-4 pt-3 pb-2"
                  hasCopyAddressOnClick
                >
                  <div className="text-sm text-gray-300">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                </Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            )}
          </Wallet>
        </div>
      </div>
    </nav>
  );
}
