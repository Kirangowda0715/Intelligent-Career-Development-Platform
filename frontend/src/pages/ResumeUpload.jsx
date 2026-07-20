import React, { useState, useEffect } from "react";
import apiClient from "../services/api";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  GraduationCap,
  Award,
  Cpu,
  Loader2,
  Plus
} from "lucide-react";

// Predefined target roles checklist
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

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [targetRole, setTargetRole] = useState(PREDEFINED_ROLES[0]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Fetch past resumes
  const fetchResumes = async () => {
    try {
      const res = await apiClient.get("/resume/");
      setResumes(res.data);
      if (res.data.length > 0 && !selectedResume) {
        setSelectedResume(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch resumes", err);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  // Run analysis when selected resume or target role changes
  useEffect(() => {
    if (selectedResume) {
      handleAnalyze(selectedResume.id);
    } else {
      setAnalysisResult(null);
    }
  }, [selectedResume, targetRole]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    setError("");
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== "application/pdf") {
        setError("Only PDF files are allowed.");
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e) => {
    setError("");
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are allowed.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiClient.post("/resume/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResumes((prev) => [res.data, ...prev]);
      setSelectedResume(res.data);
      setFile(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to upload resume.");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async (resumeId) => {
    setError("");
    setAnalyzing(true);
    try {
      const res = await apiClient.post(`/resume/${resumeId}/analyze`, {
        target_role: targetRole,
      });
      setAnalysisResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to analyze resume gap.");
    } finally {
      setAnalyzing(false);
    }
  };

  const scoreColor = (score) => {
    if (score >= 70) return "text-emerald-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-heading tracking-tight text-zinc-100">
          Resume intelligence
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Upload and parse your resume. Calculate match scores and identify skills gaps.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400 max-w-3xl">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Upload Dropzone & Saved Resumes Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Drag and Drop Zone */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 flex flex-col items-center justify-center min-h-[250px] relative">
          
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 transition-colors ${
              dragOver
                ? "border-brand-primary bg-brand-primary/5"
                : "border-border-muted hover:border-zinc-700 bg-zinc-950/20"
            }`}
          >
            {file ? (
              <div className="text-center space-y-4">
                <FileText className="mx-auto h-12 w-12 text-brand-primary animate-pulse" />
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{file.name}</p>
                  <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-primary/90 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Confirm & Parse"
                    )}
                  </button>
                  <button
                    onClick={() => setFile(null)}
                    className="rounded-lg border border-border-muted px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer text-center space-y-3 flex flex-col items-center">
                <Upload className="h-10 w-10 text-zinc-500 group-hover:text-zinc-300" />
                <div>
                  <p className="text-sm font-semibold text-zinc-300">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">PDF file formats only</p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Saved Resumes Checklist */}
        <div className="glass rounded-2xl p-6 flex flex-col">
          <h2 className="text-lg font-bold font-heading mb-4 text-zinc-200">
            Parsed Resumes
          </h2>
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[200px] pr-1">
            {resumes.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">
                No resumes uploaded yet.
              </p>
            ) : (
              resumes.map((res) => (
                <button
                  key={res.id}
                  onClick={() => setSelectedResume(res)}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                    selectedResume?.id === res.id
                      ? "border-brand-primary bg-brand-primary/5 text-zinc-100"
                      : "border-border-muted bg-zinc-950/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <div className="font-semibold truncate">{res.filename}</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {new Date(res.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Target Role Selector & Analysis Panels */}
      {selectedResume && (
        <div className="space-y-6">
          
          {/* Target Role Selector Row */}
          <div className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Briefcase className="h-6 w-6 text-brand-primary" />
              <div>
                <h3 className="font-bold text-zinc-200 font-heading">Target job profile</h3>
                <p className="text-xs text-zinc-500">Select target role to calculate match analytics</p>
              </div>
            </div>
            
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="rounded-lg border border-border-muted bg-background px-4 py-2 text-sm text-zinc-300 focus:border-brand-primary focus:outline-none"
            >
              {PREDEFINED_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 text-brand-primary animate-spin" />
              <p className="text-sm text-zinc-400 font-medium">Calculating skill gap metrics...</p>
            </div>
          ) : (
            analysisResult && (
              <div className="space-y-6">
                
                {/* 1. Dashboard Metrics Summary Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  
                  {/* Skill Match Score */}
                  <div className="glass rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-xs text-zinc-500 font-medium">Skill Match</span>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className={`text-3xl font-extrabold font-heading ${scoreColor(analysisResult.match_score)}`}>
                        {analysisResult.match_score}%
                      </span>
                    </div>
                  </div>

                  {/* Profile Strength */}
                  <div className="glass rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-xs text-zinc-500 font-medium">Profile Strength</span>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className={`text-3xl font-extrabold font-heading ${scoreColor(analysisResult.profile_strength)}`}>
                        {analysisResult.profile_strength}%
                      </span>
                    </div>
                  </div>

                  {/* Resume Completeness */}
                  <div className="glass rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-xs text-zinc-500 font-medium">Completeness</span>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold font-heading text-zinc-100">
                        {analysisResult.completeness_score}%
                      </span>
                    </div>
                  </div>

                  {/* Missing Skills Count */}
                  <div className="glass rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-xs text-zinc-500 font-medium">Missing Skills</span>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className={`text-3xl font-extrabold font-heading ${analysisResult.missing_skills.length > 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {analysisResult.missing_skills.length}
                      </span>
                    </div>
                  </div>

                  {/* Recommended Role */}
                  <div className="glass rounded-xl p-4 col-span-2 md:col-span-1 flex flex-col justify-between">
                    <span className="text-xs text-zinc-500 font-medium">Best Match Role</span>
                    <div className="mt-3">
                      <span className="text-sm font-bold text-brand-secondary font-heading line-clamp-2">
                        {analysisResult.recommended_role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Structured Parser Output Visualizer */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Parsed Details */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Resume Header Card */}
                    <div className="glass rounded-2xl p-6 space-y-6">
                      
                      {/* Name Header */}
                      <div className="flex items-center gap-3 pb-4 border-b border-border-muted">
                        <FileText className="h-6 w-6 text-brand-primary" />
                        <div>
                          <p className="text-xs text-zinc-500">Parsed candidate name</p>
                          <h4 className="text-xl font-bold font-heading text-zinc-100">
                            {selectedResume.parsed_data?.name || "Unknown Candidate"}
                          </h4>
                        </div>
                      </div>

                      {/* Extracted Skills List */}
                      <div>
                        <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2 mb-3">
                          <Cpu className="h-4 w-4 text-brand-primary" />
                          Extracted skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedResume.parsed_data?.skills?.length === 0 ? (
                            <span className="text-xs text-zinc-500">No skills parsed.</span>
                          ) : (
                            selectedResume.parsed_data?.skills?.map((skill, index) => (
                              <span
                                key={index}
                                className="rounded bg-zinc-800/80 px-2.5 py-1 text-xs font-semibold text-zinc-300 border border-border-muted"
                              >
                                {skill}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Education */}
                      <div>
                        <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2 mb-3">
                          <GraduationCap className="h-4 w-4 text-brand-primary" />
                          Education
                        </h4>
                        <ul className="space-y-2">
                          {selectedResume.parsed_data?.education?.length === 0 ? (
                            <span className="text-xs text-zinc-500">No education sections parsed.</span>
                          ) : (
                            selectedResume.parsed_data?.education?.map((edu, index) => (
                              <li key={index} className="text-xs text-zinc-400 list-disc list-inside">
                                {edu}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>

                      {/* Certifications */}
                      <div>
                        <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2 mb-3">
                          <Award className="h-4 w-4 text-brand-primary" />
                          Certifications
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedResume.parsed_data?.certifications?.length === 0 ? (
                            <span className="text-xs text-zinc-500">No certifications parsed.</span>
                          ) : (
                            selectedResume.parsed_data?.certifications?.map((cert, index) => (
                              <span
                                key={index}
                                className="rounded bg-brand-primary/5 px-2.5 py-1 text-xs font-semibold text-brand-primary border border-brand-primary/10"
                              >
                                {cert}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Projects */}
                      <div>
                        <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2 mb-3">
                          <Layers className="h-4 w-4 text-brand-primary" />
                          Projects
                        </h4>
                        <ul className="space-y-3">
                          {selectedResume.parsed_data?.projects?.length === 0 ? (
                            <span className="text-xs text-zinc-500">No projects parsed.</span>
                          ) : (
                            selectedResume.parsed_data?.projects?.map((proj, index) => (
                              <li
                                key={index}
                                className="rounded-lg bg-zinc-950/20 border border-border-muted p-3 text-xs text-zinc-400"
                              >
                                {proj}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Skill Gaps Analysis */}
                  <div className="space-y-6">
                    
                    {/* Role Requirements Overview */}
                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-base font-bold font-heading text-zinc-200 mb-4 border-b border-border-muted pb-3">
                        Target Skills Matrix ({targetRole})
                      </h3>
                      
                      {/* Missing Skills Section */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">
                          Missing Skills ({analysisResult.missing_skills.length})
                        </h4>
                        {analysisResult.missing_skills.length === 0 ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>100% skill match for this target role!</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.missing_skills.map((skill, index) => (
                              <span
                                key={index}
                                className="rounded bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 border border-red-500/20"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Matching Skills Section */}
                      <div>
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
                          Matching Skills ({analysisResult.required_skills.length - analysisResult.missing_skills.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.required_skills
                            .filter(s => !analysisResult.missing_skills.includes(s))
                            .map((skill, index) => (
                              <span
                                key={index}
                                className="rounded bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20"
                              >
                                {skill}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
