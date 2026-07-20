import React from "react";
import { Link } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center relative overflow-hidden">
      
      {/* Glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-brand-primary/5 blur-[80px]" />

      <div className="relative z-10 space-y-6 max-w-md">
        <Compass className="mx-auto h-16 w-16 text-brand-primary animate-spin" style={{ animationDuration: "10s" }} />
        
        <div className="space-y-2">
          <h1 className="text-6xl font-extrabold font-heading text-gradient">404</h1>
          <h2 className="text-2xl font-bold font-heading text-zinc-200">Page not found</h2>
          <p className="text-zinc-400 text-sm">
            The page you are looking for does not exist or has been relocated.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
