import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../services/api";
import {
  BookOpen,
  Sparkles,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  Briefcase,
  ListChecks,
  Compass,
  ArrowRight,
  TrendingUp,
  FileText
} from "lucide-react";

const PREDEFINED_ROLES = [
  "Backend Engineer",
  "AI Engineer",
  "Data Engineer",
  "Frontend Engineer",
  "Fullstack Engineer",
  "DevOps Engineer",
  "Mobile Engineer",
  "QA Engineer",
  "Security Engineer",
  "Cloud Architect"
];

const Roadmap = () => {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [targetRole, setTargetRole] = useState(PREDEFINED_ROLES[0]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Load resumes and past roadmaps on component mount
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const resumesRes = await apiClient.get("/resume/");
      setResumes(resumesRes.data);
      if (resumesRes.data.length > 0) {
        setSelectedResumeId(resumesRes.data[0].id);
      }

      const roadmapsRes = await apiClient.get("/roadmap/");
      setRoadmaps(roadmapsRes.data);
      if (roadmapsRes.data.length > 0) {
        setActiveRoadmap(roadmapsRes.data[0]);
        // Expand first week by default
        setExpandedWeeks({ 1: true });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load initial data from servers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedResumeId) {
      setError("Please upload a resume before generating a learning roadmap.");
      return;
    }

    setError("");
    setGenerating(true);
    try {
      const res = await apiClient.post("/roadmap/generate", {
        resume_id: selectedResumeId,
        target_role: targetRole
      });
      // Add new roadmap to the list and set as active
      setRoadmaps((prev) => [res.data, ...prev]);
      setActiveRoadmap(res.data);
      // Reset expanded weeks (expand week 1 by default)
      setExpandedWeeks({ 1: true });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "AI compilation timed out. Attempting standard compilation.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleWeek = (weekNum) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum]
    }));
  };

  const selectRoadmap = (roadmap) => {
    setActiveRoadmap(roadmap);
    setExpandedWeeks({ 1: true });
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
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold font-heading tracking-tight text-zinc-100 flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-brand-primary" />
          AI Learning Roadmaps
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Analyze missing skills and compile week-by-week learning paths backed by high-quality resources.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400 max-w-3xl">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Check if user has uploaded any resumes */}
      {resumes.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center max-w-3xl mx-auto space-y-6">
          <Compass className="mx-auto h-16 w-16 text-zinc-600 animate-pulse-glow" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-heading text-zinc-200">
              Resume required to build roadmaps
            </h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              We need your parsed skills from an uploaded resume to perform gap analysis and tailor a learning syllabus for your target roles.
            </p>
          </div>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-primary/90"
          >
            Upload Resume First
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        /* Full Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Generate Form & Saved List */}
          <div className="space-y-6">
            
            {/* Generation Form */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold font-heading text-zinc-200 pb-3 border-b border-border-muted flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-primary" />
                Generate New Roadmap
              </h3>
              
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Source Resume
                  </label>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full rounded-lg border border-border-muted bg-background px-3 py-2 text-sm text-zinc-300 focus:border-brand-primary focus:outline-none"
                    required
                  >
                    {resumes.map((res) => (
                      <option key={res.id} value={res.id}>
                        {res.filename} ({new Date(res.created_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Target Career Profile
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full rounded-lg border border-border-muted bg-background px-3 py-2 text-sm text-zinc-300 focus:border-brand-primary focus:outline-none"
                    required
                  >
                    {PREDEFINED_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-primary/90 disabled:opacity-50 transition-colors"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Designing Syllabus...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-brand-accent animate-pulse" />
                      Build Roadmap
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Generated Roadmaps List */}
            <div className="glass rounded-2xl p-6 flex flex-col">
              <h3 className="text-base font-bold font-heading text-zinc-200 mb-4 pb-3 border-b border-border-muted flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-brand-primary" />
                History & Versions
              </h3>
              
              <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
                {roadmaps.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-6">
                    No roadmaps compiled yet. Select a role above to generate your first path!
                  </p>
                ) : (
                  roadmaps.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => selectRoadmap(r)}
                      className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex flex-col gap-1.5 ${
                        activeRoadmap?.id === r.id
                          ? "border-brand-primary bg-brand-primary/5 text-zinc-100"
                          : "border-border-muted bg-zinc-950/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <div className="font-bold font-heading flex items-center gap-2">
                        <Briefcase className="h-4 w-4 shrink-0 text-brand-primary" />
                        <span className="truncate">{r.target_role}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Roadmap Details Viewer */}
          <div className="lg:col-span-2 space-y-6">
            {generating ? (
              /* Generating Loader State */
              <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center min-h-[500px] space-y-6 border border-brand-primary/10">
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <div className="absolute h-full w-full rounded-full border-4 border-brand-primary/20 border-t-brand-primary animate-spin"></div>
                  <Sparkles className="h-6 w-6 text-brand-accent animate-pulse" />
                </div>
                <div className="text-center space-y-2 max-w-sm">
                  <h3 className="text-lg font-bold font-heading text-zinc-100">
                    Assembling Learning Milestones
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Analyzing skill deficiencies, mapping educational documentation, and assembling a custom roadmap via Llama 3...
                  </p>
                </div>
              </div>
            ) : activeRoadmap ? (
              /* Display Active Roadmap */
              <div className="space-y-6">
                
                {/* Roadmap Meta Summary */}
                <div className="glass rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-primary/5 blur-3xl"></div>
                  
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                        Syllabus Profile
                      </span>
                      <h2 className="mt-1 text-2xl font-extrabold font-heading text-zinc-100">
                        {activeRoadmap.target_role} Path
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-brand-primary" />
                          Generated {new Date(activeRoadmap.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-brand-accent" />
                          Duration: {activeRoadmap.content?.duration_weeks || 4} Weeks
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Priorities Section */}
                  {activeRoadmap.content?.priorities && (
                    <div className="mt-6 pt-5 border-t border-border-muted">
                      <h4 className="text-xs font-bold text-brand-accent uppercase tracking-wider mb-3">
                        Strategic Priorities
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {activeRoadmap.content.priorities.map((priority, index) => (
                          <li key={index} className="flex items-start gap-2.5 text-xs text-zinc-300">
                            <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary"></span>
                            <span>{priority}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Timeline Weekly Accordion */}
                <div className="space-y-4">
                  {activeRoadmap.content?.weekly_plan?.map((weekItem) => {
                    const isExpanded = expandedWeeks[weekItem.week];
                    return (
                      <div
                        key={weekItem.week}
                        className={`glass rounded-2xl overflow-hidden transition-all duration-200 border ${
                          isExpanded ? "border-brand-primary/20 bg-zinc-900/30" : "border-border-muted hover:border-zinc-800"
                        }`}
                      >
                        {/* Accordion Header */}
                        <button
                          onClick={() => toggleWeek(weekItem.week)}
                          className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-zinc-800/20"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-extrabold font-heading text-sm transition-colors ${
                              isExpanded ? "bg-brand-primary/20 text-brand-primary" : "bg-zinc-800 text-zinc-400"
                            }`}>
                              W{weekItem.week}
                            </div>
                            <div>
                              <h3 className="text-base font-bold font-heading text-zinc-200">
                                {weekItem.title}
                              </h3>
                              <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                                Technologies: {weekItem.technologies?.join(", ") || "General"}
                              </p>
                            </div>
                          </div>
                          
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-zinc-500" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-zinc-500" />
                          )}
                        </button>

                        {/* Accordion Content */}
                        {isExpanded && (
                          <div className="px-5 pb-6 pt-1 border-t border-border-muted/50 space-y-5">
                            
                            {/* Topics */}
                            <div>
                              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2.5">
                                Weekly Syllabus & Core Concepts
                              </h4>
                              <ul className="space-y-2">
                                {weekItem.topics?.map((topic, i) => (
                                  <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-300 bg-zinc-950/30 rounded-xl p-2.5 border border-border-muted/30">
                                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-[10px] font-bold text-brand-primary">
                                      {i + 1}
                                    </span>
                                    <span>{topic}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Learning Resources */}
                            {weekItem.resources && weekItem.resources.length > 0 && (
                              <div>
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2.5">
                                  Recommended Resources
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {weekItem.resources.map((res, i) => (
                                    <a
                                      key={i}
                                      href={res.url.startsWith("http") ? res.url : "#"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between gap-4 p-3 rounded-xl bg-zinc-950/50 border border-border-muted hover:border-zinc-700 transition-all text-xs font-medium text-zinc-300 hover:text-zinc-100 group"
                                    >
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="h-4 w-4 text-brand-accent shrink-0 group-hover:scale-105 transition-transform" />
                                        <span className="truncate">{res.name}</span>
                                      </div>
                                      <ExternalLink className="h-3.5 w-3.5 text-zinc-600 group-hover:text-brand-accent shrink-0" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* No Active Roadmap State */
              <div className="glass rounded-2xl p-12 text-center min-h-[500px] flex flex-col items-center justify-center space-y-6">
                <Compass className="h-16 w-16 text-zinc-700" />
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-heading text-zinc-300">
                    No Roadmap Selected
                  </h3>
                  <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                    Select a version from history on the left or generate a brand new roadmap version.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Roadmap;
