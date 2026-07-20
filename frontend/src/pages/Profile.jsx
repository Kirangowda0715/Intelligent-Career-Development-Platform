import React from "react";
import { useAuth } from "../context/AuthContext";
import { 
  User, 
  Mail, 
  Calendar, 
  ShieldAlert, 
  UserCheck 
} from "lucide-react";

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold font-heading tracking-tight text-zinc-100">
          Account Profile
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your personal settings and view credential logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Card: Summary */}
        <div className="glass rounded-2xl p-6 text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <User className="h-10 w-10" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-heading text-zinc-200">
              {user?.email.split("@")[0]}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">Platform Member</p>
          </div>
          <div className="rounded-lg bg-zinc-950/40 p-3.5 border border-border-muted flex items-center justify-center gap-2 text-xs text-brand-primary font-medium">
            <UserCheck className="h-4 w-4" />
            Active Session Verified
          </div>
        </div>

        {/* Right Cards: Details */}
        <div className="md:col-span-2 space-y-6">
          
          {/* User Information Sheet */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-base font-bold font-heading text-zinc-200 mb-5 pb-3 border-b border-border-muted">
              Security & Profile Metadata
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Email Address</p>
                  <p className="text-sm font-semibold text-zinc-200">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium">User Identifier (UUID)</p>
                  <p className="text-sm font-mono text-zinc-400 break-all">{user?.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Joined Date</p>
                  <p className="text-sm font-semibold text-zinc-200">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Loading..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
