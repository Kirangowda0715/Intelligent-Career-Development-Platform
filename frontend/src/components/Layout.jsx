import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu, X } from "lucide-react";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = (state) => {
    setSidebarOpen(typeof state === "boolean" ? state : !sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background text-zinc-100">
      {/* Mobile Top Header Navbar */}
      <header className="flex h-16 items-center justify-between border-b border-border-muted bg-surface/80 px-6 backdrop-blur-md md:hidden">
        <span className="text-xl font-bold font-heading tracking-wide text-gradient">
          CareerAI
        </span>
        <button
          onClick={() => toggleSidebar()}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content scroll window */}
      <div className="flex flex-col md:pl-64">
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile background overlay */}
      {sidebarOpen && (
        <div
          onClick={() => toggleSidebar(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}
    </div>
  );
};

export default Layout;
