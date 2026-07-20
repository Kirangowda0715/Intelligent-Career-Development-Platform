import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FileText, 
  Cpu, 
  TrendingUp, 
  HelpCircle, 
  ArrowRight,
  Sparkles
} from "lucide-react";

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      title: "Deterministic Resume Parsing",
      desc: "Instantly parse and extract skills, education, certifications, and projects from PDF resumes using PyMuPDF and NLP-powered spaCy rules.",
      icon: FileText,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
    },
    {
      title: "Real-time Skill Gap Matrix",
      desc: "Target roles like AI Engineer or Backend Engineer. Contrast your profile against the seed database to view missing skills and match scores.",
      icon: Cpu,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
    },
    {
      title: "AI-Generated Roadmaps",
      desc: "Receive weekly training timelines, learning priorities, and recommended web resources generated with deterministic score context.",
      icon: TrendingUp,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
    },
    {
      title: "Adaptive Interview Preparation",
      desc: "Prepare for your target role with custom technical, behavioral, and follow-up questions focused directly on your skill gaps.",
      icon: HelpCircle,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-zinc-100 flex flex-col items-center justify-center px-6 py-20">
      
      {/* Background radial gradient glow */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-brand-primary/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-brand-secondary/10 blur-[100px] animate-pulse-glow" />

      {/* Hero Header */}
      <div className="relative z-10 max-w-4xl text-center flex flex-col items-center">
        
        {/* Banner Pill */}
        <div className="mb-6 flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/5 px-4 py-1.5 text-sm text-brand-primary font-medium">
          <Sparkles className="h-4 w-4" />
          <span>Next-Gen Career Development Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold font-heading tracking-tight leading-tight mb-6">
          Accelerate Your Career with{" "}
          <span className="text-gradient">AI-Powered Intelligence</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-zinc-400 font-sans max-w-2xl leading-relaxed mb-10">
          Upload your resume to extract key professional assets, identify skill gaps for 
          target roles, and generate learning roadmaps alongside personalized interview questions.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-primary/90"
          >
            {isAuthenticated ? "Go to Dashboard" : "Get Started for Free"}
            <ArrowRight className="h-5 w-5" />
          </Link>
          
          {!isAuthenticated && (
            <Link
              to="/login"
              className="rounded-xl border border-border-muted bg-surface/50 px-6 py-3.5 text-base font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Features Grid Section */}
      <div className="relative z-10 max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div 
              key={i} 
              className="group p-6 rounded-2xl bg-surface/40 border border-border-muted hover:border-brand-primary/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${feature.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-zinc-200 mb-2 font-heading group-hover:text-brand-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer Branding */}
      <footer className="relative z-10 mt-24 text-center text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} CareerAI Platform. All rights reserved. Clean Architecture Portfolio Project.
      </footer>
    </div>
  );
};

export default LandingPage;
