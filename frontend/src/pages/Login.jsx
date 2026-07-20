import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Compass, AlertCircle, Loader2 } from "lucide-react";

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  // Determine redirection path after success
  const from = location.state?.from?.pathname || "/dashboard";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Display query param messages (e.g. session expired or registered success)
  useEffect(() => {
    if (searchParams.get("session_expired")) {
      setInfoMessage("Your session has expired. Please sign in again.");
    } else if (searchParams.get("registered")) {
      setInfoMessage("Registration successful! You can now log in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        "Incorrect email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-brand-primary/5 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        
        {/* Logo Branding */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <Compass className="h-8 w-8 text-brand-primary" />
            <span className="text-2xl font-bold font-heading text-gradient">
              CareerAI
            </span>
          </Link>
          <h2 className="text-2xl font-bold font-heading text-zinc-100">
            Sign in to your account
          </h2>
          <p className="mt-1.5 text-sm text-zinc-400">
            Access resume parsing and skill analytics
          </p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-2xl p-8 shadow-xl">
          
          {/* Messages */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/5 p-3.5 text-sm text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-brand-primary/30 bg-brand-primary/5 p-3.5 text-sm text-brand-primary">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border-muted bg-zinc-950 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-brand-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border-muted bg-zinc-950 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-brand-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-primary/90 focus:outline-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Navigation Helper */}
          <p className="mt-6 text-center text-sm text-zinc-400">
            New to CareerAI?{" "}
            <Link
              to="/register"
              className="font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
