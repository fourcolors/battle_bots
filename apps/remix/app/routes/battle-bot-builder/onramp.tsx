// import { usePrivy } from "@privy-io/react-auth";
// import { useNavigate } from "@remix-run/react";
// import { useEffect } from "react";
// import { OnchainKitProvider } from '@coinbase/onchainkit';
// import { ConnectWallet } from '@coinbase/onchainkit/wallet';
// import { Avatar } from '@coinbase/onchainkit/identity';
// import { TokenRow } from '@coinbase/onchainkit/token';
// import { base } from 'viem/chains';
// import '@coinbase/onchainkit/styles.css';

// export default function BattleBotBuilder() {
//   const { ready, authenticated } = usePrivy();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (ready && !authenticated) {
//       navigate("/");
//     }
//   }, [ready, authenticated, navigate]);

//   return (
//     <OnchainKitProvider apiKey="liSnUM_Ngr62kqupe50h6QDZPje8i1zg" chain={base}>
//       <div className="p-8">
//         <h1 className="text-3xl font-bold mb-8">Battle Bot Builder</h1>
        
//         <div className="space-y-6">
//           {/* Wallet Connection */}
//           <div className="bg-white p-6 rounded-lg shadow">
//             <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
//             <ConnectWallet />
//           </div>

//           {/* Bot Identity */}
//           <div className="bg-white p-6 rounded-lg shadow">
//             <h2 className="text-xl font-semibold mb-4">Bot Identity</h2>
//             <Avatar address="0x838aD0EAE54F99F1926dA7C3b6bFbF617389B4D9" />
//           </div>

//           {/* Token Display */}
//           <div className="bg-white p-6 rounded-lg shadow">
//             <h2 className="text-xl font-semibold mb-4">Bot Token</h2>
//             <TokenRow token={{
//               address: "0x50c5725949a6f0c72e6c4a641f24049a917db0cb",
//               chainId: 8453,
//               decimals: 18,
//               name: "BattleBot Token",
//               symbol: "BBT",
//               image: "https://makerdao.com/images/logo.svg"
//             }} />
//           </div>
//         </div>
//       </div>
//     </OnchainKitProvider>
//   );
// }
