import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../services/api";
import {
  MessageSquare,
  Sparkles,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Briefcase,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  Compass,
  ArrowRight,
  UserCheck
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

const InterviewPrep = () => {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [targetRole, setTargetRole] = useState(PREDEFINED_ROLES[0]);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [showAnswerPoints, setShowAnswerPoints] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const resumesRes = await apiClient.get("/resume/");
      setResumes(resumesRes.data);
      if (resumesRes.data.length > 0) {
        setSelectedResumeId(resumesRes.data[0].id);
      }

      const sessionsRes = await apiClient.get("/interview/");
      setSessions(sessionsRes.data);
      if (sessionsRes.data.length > 0) {
        setActiveSession(sessionsRes.data[0]);
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
      setError("Please upload a resume before generating mock interview questions.");
      return;
    }

    setError("");
    setGenerating(true);
    try {
      const res = await apiClient.post("/interview/generate", {
        resume_id: selectedResumeId,
        target_role: targetRole
      });
      setSessions((prev) => [res.data, ...prev]);
      setActiveSession(res.data);
      setExpandedQuestions({});
      setShowAnswerPoints({});
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "AI compilation timed out. Attempting standard compilation.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleQuestion = (qId) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const toggleAnswerPoints = (e, qId) => {
    e.stopPropagation(); // Avoid triggering parent collapse
    setShowAnswerPoints((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const selectSession = (session) => {
    setActiveSession(session);
    setExpandedQuestions({});
    setShowAnswerPoints({});
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
          <MessageSquare className="h-8 w-8 text-brand-primary" />
          AI Mock Interview Prep
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Prepare for targeted career paths with technical, behavioral, and follow-up questions matching your skills gaps.
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
              Resume required to build questions
            </h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              We need parsed skills from an uploaded resume to perform gap analysis and construct custom interview mockups.
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
                Generate Session
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
                    Target Job Profile
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
                      Drafting Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-brand-accent animate-pulse" />
                      Build Interview Mock
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Generated Sessions List */}
            <div className="glass rounded-2xl p-6 flex flex-col">
              <h3 className="text-base font-bold font-heading text-zinc-200 mb-4 pb-3 border-b border-border-muted flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-brand-primary" />
                History & Mock Sessions
              </h3>
              
              <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
                {sessions.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-6">
                    No sessions compiled yet. Select a role above to generate your first mock interview set!
                  </p>
                ) : (
                  sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectSession(s)}
                      className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex flex-col gap-1.5 ${
                        activeSession?.id === s.id
                          ? "border-brand-primary bg-brand-primary/5 text-zinc-100"
                          : "border-border-muted bg-zinc-950/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <div className="font-bold font-heading flex items-center gap-2">
                        <Briefcase className="h-4 w-4 shrink-0 text-brand-primary" />
                        <span className="truncate">{s.target_role}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(s.created_at).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Interview Session Details Viewer */}
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
                    Compiling Study Sheets
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Constructing technical, behavioral, and follow-up mocks aligned with your profile credentials using Llama 3...
                  </p>
                </div>
              </div>
            ) : activeSession ? (
              /* Display Active Interview Mock */
              <div className="space-y-8">
                
                {/* Session Meta Summary */}
                <div className="glass rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-primary/5 blur-3xl"></div>
                  
                  <div>
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                      Study session profile
                    </span>
                    <h2 className="mt-1 text-2xl font-extrabold font-heading text-zinc-100">
                      {activeSession.target_role} Mock Interview
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-brand-primary" />
                        Generated {new Date(activeSession.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4 text-brand-accent" />
                        Total Questions: {(activeSession.questions?.technical_questions?.length || 0) + 
                          (activeSession.questions?.behavioral_questions?.length || 0) + 
                          (activeSession.questions?.follow_up_questions?.length || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-6">
                  
                  {/* Category 1: Technical Questions */}
                  {activeSession.questions?.technical_questions && activeSession.questions.technical_questions.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-brand-primary"></span>
                        Technical Questions
                      </h3>
                      <div className="space-y-3">
                        {activeSession.questions.technical_questions.map((q, idx) => {
                          const qKey = `tech_${idx}`;
                          const isExpanded = expandedQuestions[qKey];
                          const showAnswer = showAnswerPoints[qKey];
                          
                          return (
                            <div
                              key={qKey}
                              onClick={() => toggleQuestion(qKey)}
                              className={`glass rounded-xl overflow-hidden cursor-pointer border transition-all duration-200 ${
                                isExpanded ? "border-brand-primary/20 bg-zinc-900/30" : "border-border-muted hover:border-zinc-800"
                              }`}
                            >
                              <div className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <span className="text-xs text-zinc-500 font-bold mt-0.5">T{idx + 1}.</span>
                                  <p className="text-sm font-semibold text-zinc-200">{q.question}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <button
                                    onClick={(e) => toggleAnswerPoints(e, qKey)}
                                    className={`rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase transition-colors border ${
                                      showAnswer 
                                        ? "bg-brand-primary/20 border-brand-primary/30 text-brand-primary"
                                        : "bg-zinc-800/40 border-border-muted text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                                    }`}
                                  >
                                    Guide Outline
                                  </button>
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-zinc-500" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="px-4 pb-4 pt-1 border-t border-border-muted/30 text-xs text-zinc-400 space-y-4">
                                  {showAnswer ? (
                                    <div className="rounded-xl bg-brand-primary/5 p-3.5 border border-brand-primary/10 space-y-2.5">
                                      <h4 className="font-bold text-zinc-300 flex items-center gap-1.5">
                                        <Lightbulb className="h-4 w-4 text-brand-accent" />
                                        Expected Answer Points:
                                      </h4>
                                      <ul className="space-y-1.5 pl-2">
                                        {q.expected_answer_points?.map((pt, i) => (
                                          <li key={i} className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                            <span>{pt}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : (
                                    <p className="text-zinc-500 italic p-1">
                                      Click the "Guide Outline" badge to see what details you should mention.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Category 2: Behavioral Questions */}
                  {activeSession.questions?.behavioral_questions && activeSession.questions.behavioral_questions.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-brand-secondary"></span>
                        Behavioral Questions
                      </h3>
                      <div className="space-y-3">
                        {activeSession.questions.behavioral_questions.map((q, idx) => {
                          const qKey = `behav_${idx}`;
                          const isExpanded = expandedQuestions[qKey];
                          const showAnswer = showAnswerPoints[qKey];

                          return (
                            <div
                              key={qKey}
                              onClick={() => toggleQuestion(qKey)}
                              className={`glass rounded-xl overflow-hidden cursor-pointer border transition-all duration-200 ${
                                isExpanded ? "border-brand-secondary/20 bg-zinc-900/30" : "border-border-muted hover:border-zinc-800"
                              }`}
                            >
                              <div className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <span className="text-xs text-zinc-500 font-bold mt-0.5">B{idx + 1}.</span>
                                  <p className="text-sm font-semibold text-zinc-200">{q.question}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <button
                                    onClick={(e) => toggleAnswerPoints(e, qKey)}
                                    className={`rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase transition-colors border ${
                                      showAnswer 
                                        ? "bg-brand-secondary/20 border-brand-secondary/30 text-brand-secondary"
                                        : "bg-zinc-800/40 border-border-muted text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                                    }`}
                                  >
                                    Guide Outline
                                  </button>
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-zinc-500" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="px-4 pb-4 pt-1 border-t border-border-muted/30 text-xs text-zinc-400 space-y-4">
                                  {showAnswer ? (
                                    <div className="rounded-xl bg-brand-secondary/5 p-3.5 border border-brand-secondary/10 space-y-2.5">
                                      <h4 className="font-bold text-zinc-300 flex items-center gap-1.5">
                                        <Lightbulb className="h-4 w-4 text-brand-secondary" />
                                        STAR Method Points:
                                      </h4>
                                      <ul className="space-y-1.5 pl-2">
                                        {q.expected_answer_points?.map((pt, i) => (
                                          <li key={i} className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                            <span>{pt}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : (
                                    <p className="text-zinc-500 italic p-1">
                                      Click the "Guide Outline" badge to see what details you should mention.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Category 3: Follow-up Questions */}
                  {activeSession.questions?.follow_up_questions && activeSession.questions.follow_up_questions.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider pl-1 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-brand-accent"></span>
                        Follow-up / Deep Dives
                      </h3>
                      <div className="space-y-3">
                        {activeSession.questions.follow_up_questions.map((q, idx) => {
                          const qKey = `follow_${idx}`;
                          const isExpanded = expandedQuestions[qKey];
                          const showAnswer = showAnswerPoints[qKey];

                          return (
                            <div
                              key={qKey}
                              onClick={() => toggleQuestion(qKey)}
                              className={`glass rounded-xl overflow-hidden cursor-pointer border transition-all duration-200 ${
                                isExpanded ? "border-brand-accent/20 bg-zinc-900/30" : "border-border-muted hover:border-zinc-800"
                              }`}
                            >
                              <div className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <span className="text-xs text-zinc-500 font-bold mt-0.5">F{idx + 1}.</span>
                                  <p className="text-sm font-semibold text-zinc-200">{q.question}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <button
                                    onClick={(e) => toggleAnswerPoints(e, qKey)}
                                    className={`rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase transition-colors border ${
                                      showAnswer 
                                        ? "bg-brand-accent/20 border-brand-accent/30 text-brand-accent"
                                        : "bg-zinc-800/40 border-border-muted text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                                    }`}
                                  >
                                    Guide Outline
                                  </button>
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-zinc-500" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="px-4 pb-4 pt-1 border-t border-border-muted/30 text-xs text-zinc-400 space-y-4">
                                  {showAnswer ? (
                                    <div className="rounded-xl bg-brand-accent/5 p-3.5 border border-brand-accent/10 space-y-2.5">
                                      <h4 className="font-bold text-zinc-300 flex items-center gap-1.5">
                                        <Lightbulb className="h-4 w-4 text-brand-accent" />
                                        Key Technical Details:
                                      </h4>
                                      <ul className="space-y-1.5 pl-2">
                                        {q.expected_answer_points?.map((pt, i) => (
                                          <li key={i} className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                            <span>{pt}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : (
                                    <p className="text-zinc-500 italic p-1">
                                      Click the "Guide Outline" badge to see what details you should mention.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ) : (
              /* No Active Session State */
              <div className="glass rounded-2xl p-12 text-center min-h-[500px] flex flex-col items-center justify-center space-y-6">
                <Compass className="h-16 w-16 text-zinc-700" />
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-heading text-zinc-300">
                    No Session Selected
                  </h3>
                  <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                    Select a version from mock sessions history on the left or generate a brand new set of mock questions.
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

export default InterviewPrep;
