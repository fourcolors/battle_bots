import { Link, useLocation } from "@remix-run/react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-[#2D1821]">
      {/* Left Navigation */}
      <nav className="w-20 bg-[#3D2229] border-r border-gray-700/30 flex flex-col items-center py-6 fixed h-screen">
        {/* Logo */}
        <Link
          to="/"
          className="p-3 mb-8 hover:scale-105 transition-transform duration-200"
        >
          <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <span className="text-2xl font-bold text-[#2D1821]">B</span>
          </div>
        </Link>

        {/* Main Navigation */}
        <div className="flex-1 flex flex-col items-center space-y-2">
          <NavLink to="/" icon="🏠" isActive={isActive("/")} />
          <NavLink to="/bot" icon="🤖" isActive={isActive("/bot")} />
          <NavLink to="/battles" icon="⚔️" isActive={isActive("/battles")} />
          <NavLink
            to="/leaderboard"
            icon="🏆"
            isActive={isActive("/leaderboard")}
          />
          <NavLink to="/settings" icon="⚙️" isActive={isActive("/settings")} />
        </div>

        {/* Bottom Action */}
        <button
          className="mt-auto p-3 rounded-xl transition-all duration-200 hover:scale-105"
          onClick={() => console.log("Add new item")}
        >
          <div className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-500 hover:border-yellow-500 hover:text-yellow-500 transition-colors duration-200 hover:shadow-lg hover:shadow-yellow-500/10">
            +
          </div>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-20">{children}</main>
    </div>
  );
}

interface NavLinkProps {
  to: string;
  icon: string;
  isActive: boolean;
}

function NavLink({ to, icon, isActive }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`p-3 rounded-xl transition-all duration-200 relative group hover:scale-105
        ${
          isActive
            ? "bg-yellow-500/20 text-yellow-500 shadow-lg shadow-yellow-500/20"
            : "text-gray-500 hover:bg-[#4D2D35] hover:text-gray-300"
        }`}
    >
      <span className="text-2xl relative z-10">{icon}</span>

      {/* Hover Background */}
      <div
        className={`absolute inset-0 rounded-xl transition-all duration-200 ${
          isActive
            ? "bg-yellow-500/5"
            : "bg-transparent group-hover:bg-[#4D2D35]"
        }`}
      />

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute -right-[2px] top-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-500 rounded-l-full shadow-lg shadow-yellow-500/20" />
      )}

      {/* Tooltip */}
      <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#4D2D35] text-gray-200 text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-xl">
        {to === "/"
          ? "Home"
          : to.slice(1).charAt(0).toUpperCase() + to.slice(2)}
        {/* Tooltip Arrow */}
        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-[#4D2D35] rotate-45" />
      </div>
    </Link>
  );
}
