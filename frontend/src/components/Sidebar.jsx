import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutGrid, 
  UploadCloud, 
  User, 
  LogOut,
  Briefcase,
  Compass,
  BookOpen,
  MessageSquare
} from "lucide-react";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutGrid },
    { name: "Upload Resume", path: "/upload", icon: UploadCloud },
    { name: "Learning Roadmaps", path: "/roadmap", icon: BookOpen },
    { name: "Interview Prep", path: "/interview-prep", icon: MessageSquare },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-border-muted bg-surface transition-transform duration-300 md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-border-muted px-6">
        <Link to="/dashboard" className="flex items-center gap-2" onClick={toggleSidebar}>
          <Compass className="h-6 w-6 text-brand-primary" />
          <span className="text-xl font-bold font-heading tracking-wide text-gradient">
            CareerAI
          </span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 px-4 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => toggleSidebar(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-brand-primary" : "text-zinc-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="border-t border-border-muted p-4">
        {user && (
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary font-bold text-sm">
              {user.email.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs text-zinc-500">Logged in as</p>
              <p className="truncate text-sm font-medium text-zinc-200">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
