import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  FileText,
  TrendingUp,
  Cpu,
  Plus,
  ArrowRight,
  Briefcase,
  Layers,
  Award,
  BookOpen,
  MessageSquare
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

const Dashboard = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [latestResume, setLatestResume] = useState(null);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/resume/");
      setResumes(res.data);

      if (res.data.length > 0) {
        const latest = res.data[0];
        setLatestResume(latest);

        // Run gap analysis against recommended/default role (Backend Engineer)
        const defaultRole = "Backend Engineer";
        const gapRes = await apiClient.post(`/resume/${latest.id}/analyze`, {
          target_role: defaultRole
        });
        setLatestAnalysis(gapRes.data);

        // Build historical chart data
        const historyData = res.data
          .slice()
          .reverse() // Oldest first
          .map((r, i) => {
            // Estimate scores for chart
            const completeness = calculateCompleteness(r.parsed_data || {});
            const skillsLen = r.parsed_data?.skills?.length || 0;
            const matchEst = Math.min(100, skillsLen * 10);
            return {
              name: `Resume ${i + 1}`,
              Completeness: completeness,
              "Skill Count": skillsLen
            };
          });
        setChartData(historyData);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const calculateCompleteness = (parsed_data) => {
    let score = 0.0;
    if (parsed_data.name && parsed_data.name !== "Unknown candidate") score += 15.0;
    if (parsed_data.skills?.length > 0) score += 25.0;
    if (parsed_data.education?.length > 0) score += 20.0;
    if (parsed_data.certifications?.length > 0) score += 15.0;
    if (parsed_data.projects?.length > 0) score += 25.0;
    return score;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading tracking-tight text-zinc-100">
            Welcome back, {user?.email.split("@")[0]}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Here is a summary of your career development metrics.
          </p>
        </div>
        
        <Link
          to="/upload"
          className="flex items-center gap-1.5 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-primary/90"
        >
          <Plus className="h-4 w-4" />
          Upload Resume
        </Link>
      </div>

      {resumes.length === 0 ? (
        /* Empty State */
        <div className="glass rounded-2xl p-12 text-center max-w-3xl mx-auto space-y-6">
          <FileText className="mx-auto h-16 w-16 text-zinc-600" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-heading text-zinc-200">
              No resumes uploaded yet
            </h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              To unlock skill gap analysis, recommendations, and roadmap parameters, 
              please upload a PDF copy of your resume.
            </p>
          </div>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-primary/90"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        /* Dashboard Layout */
        <div className="space-y-8">
          
          {/* Overview Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Profile Strength */}
            <div className="glass rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-brand-primary opacity-20">
                <TrendingUp className="h-8 w-8" />
              </div>
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                Profile Strength
              </span>
              <h3 className="mt-3 text-4xl font-extrabold font-heading text-brand-primary">
                {latestAnalysis?.profile_strength || 0}%
              </h3>
              <p className="mt-2 text-xs text-zinc-400 leading-normal">
                Combined resume completeness and target match weighting.
              </p>
            </div>

            {/* Target Skill Match */}
            <div className="glass rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-brand-secondary opacity-20">
                <Cpu className="h-8 w-8" />
              </div>
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                Backend Match
              </span>
              <h3 className="mt-3 text-4xl font-extrabold font-heading text-brand-secondary">
                {latestAnalysis?.match_score || 0}%
              </h3>
              <p className="mt-2 text-xs text-zinc-400 leading-normal">
                Matches for standard Backend requirements.
              </p>
            </div>

            {/* Completeness Score */}
            <div className="glass rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-brand-accent opacity-20">
                <FileText className="h-8 w-8" />
              </div>
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                Completeness
              </span>
              <h3 className="mt-3 text-4xl font-extrabold font-heading text-brand-accent">
                {latestAnalysis?.completeness_score || 0}%
              </h3>
              <p className="mt-2 text-xs text-zinc-400 leading-normal">
                Based on filled fields in standard schemas.
              </p>
            </div>

            {/* Recommended Role */}
            <div className="glass rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-emerald-400 opacity-20">
                <Briefcase className="h-8 w-8" />
              </div>
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                Best Fit Target
              </span>
              <h3 className="mt-3 text-lg font-bold font-heading text-emerald-400 line-clamp-1">
                {latestAnalysis?.recommended_role || "Calculating..."}
              </h3>
              <p className="mt-2 text-xs text-zinc-400 leading-normal">
                Determined through matching highest role catalog overlap.
              </p>
            </div>
          </div>
 
          {/* Quick Action Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6 flex items-center justify-between gap-4 border border-brand-primary/10 hover:border-brand-primary/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold font-heading text-zinc-200">
                    AI Study Roadmaps
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Generate weekly learning paths with curated resources to master missing skills.
                  </p>
                </div>
              </div>
              <Link
                to="/roadmap"
                className="shrink-0 flex items-center gap-1 text-xs font-bold text-brand-primary hover:text-brand-primary/80 transition-colors bg-brand-primary/10 px-3 py-2 rounded-lg"
              >
                Open
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="glass rounded-2xl p-6 flex items-center justify-between gap-4 border border-brand-secondary/10 hover:border-brand-secondary/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-secondary/10 text-brand-secondary">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold font-heading text-zinc-200">
                    Mock Interview Practice
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Practice custom technical and behavioral questions mapped to your target roles.
                  </p>
                </div>
              </div>
              <Link
                to="/interview-prep"
                className="shrink-0 flex items-center gap-1 text-xs font-bold text-brand-secondary hover:text-brand-secondary/80 transition-colors bg-brand-secondary/10 px-3 py-2 rounded-lg"
              >
                Practice
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Grid Layout: Visual Chart & Recent Resumes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart Area */}
            <div className="lg:col-span-2 glass rounded-2xl p-6 flex flex-col">
              <h3 className="text-lg font-bold font-heading text-zinc-200 mb-6">
                Resume Evolution Metrics
              </h3>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px" }}
                      labelStyle={{ fontWeight: "bold", color: "#f4f4f5" }}
                    />
                    <Bar dataKey="Completeness" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Skill Count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Uploads List */}
            <div className="glass rounded-2xl p-6 flex flex-col">
              <h3 className="text-lg font-bold font-heading text-zinc-200 mb-4">
                Recent Resumes
              </h3>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[320px] pr-1">
                {resumes.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-xl border border-border-muted bg-zinc-950/20 flex flex-col justify-between"
                  >
                    <div className="font-semibold text-sm truncate text-zinc-200">
                      {res.filename}
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500 mt-3">
                      <span>{new Date(res.created_at).toLocaleDateString()}</span>
                      <Link
                        to="/upload"
                        className="text-brand-primary hover:text-brand-primary/80 font-medium inline-flex items-center gap-1"
                      >
                        Inspect
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
