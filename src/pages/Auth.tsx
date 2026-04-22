import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

// Apply dark mode from localStorage on mount
const applyDarkMode = () => {
  const stored = localStorage.getItem("ichen_dark_mode");
  if (stored === "true") document.documentElement.classList.add("dark");
};

const PASSWORD_MIN = 12;

const getPasswordStrength = (pw: string): { score: number; label: string; color: string } => {
  if (pw.length === 0) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-destructive" };
  if (score <= 3) return { score, label: "Fair", color: "bg-amber-400" };
  return { score, label: "Strong", color: "bg-green-500" };
};

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Propagate dark mode
  useEffect(() => { applyDarkMode(); }, []);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/editor", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    setError("");
    setSuccess(false);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (mode === "signup" && password.length < PASSWORD_MIN) {
      setError(`Password must be at least ${PASSWORD_MIN} characters.`);
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setSuccess(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/editor", { replace: true });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const strength = mode === "signup" ? getPasswordStrength(password) : null;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-center p-12 bg-primary/5 border-r border-border">
        <div className="max-w-lg space-y-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ICHEN Manuscript" className="h-9 w-auto" />
            <span className="font-bold text-lg text-foreground tracking-tight">ICHEN Manuscript</span>
          </Link>

          <div>
            <h1 className="text-4xl font-bold text-foreground leading-tight mb-4">
              The AI editor that<br />walks beside you
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
              A distraction-free writing environment with editorial AI that suggests — never replaces — your voice.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: "✦", title: "Four AI personas", desc: "Clarity, emotion, plot, and style — each with a unique lens." },
              { icon: "✦", title: "Emotion Heatmap", desc: "Visualize the emotional arc of every chapter." },
              { icon: "✦", title: "Your story stays yours", desc: "AI suggests. You decide. Always." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-primary text-xs mt-1.5 shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            No credit card required. Free to start.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
          <img src="/logo.png" alt="ICHEN Manuscript" className="h-10 w-auto" />
          <span className="font-bold text-base text-foreground">ICHEN Manuscript</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Back to home (mobile) */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8 lg:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1.5">
              {mode === "signin"
                ? "Sign in to continue your manuscript"
                : "Start writing your story today"}
            </p>
          </div>

          {/* Success state */}
          {success ? (
            <div className="flex flex-col items-center text-center gap-4 py-6">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div>
                <p className="font-semibold text-foreground text-lg">Check your email</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a confirmation link to <strong>{email}</strong>.
                  Click it to activate your account.
                </p>
              </div>
              <button
                onClick={() => switchMode("signin")}
                className="text-sm text-primary hover:underline font-medium"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-shadow"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    minLength={mode === "signup" ? PASSWORD_MIN : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 px-3 pr-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                {mode === "signup" && password.length > 0 && strength && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((seg) => (
                        <div
                          key={seg}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            seg <= strength.score ? strength.color : "bg-border"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${
                      strength.score <= 1 ? "text-destructive" :
                      strength.score <= 3 ? "text-amber-500" : "text-green-600"
                    }`}>
                      {strength.label} password
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="confirm">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full h-10 px-3 pr-10 rounded-lg border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 transition-shadow ${
                        passwordsMismatch
                          ? "border-destructive focus:ring-destructive"
                          : passwordsMatch
                          ? "border-green-500 focus:ring-green-500"
                          : "border-input focus:ring-ring"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordsMismatch && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                  {passwordsMatch && (
                    <p className="text-xs text-green-600">Passwords match</p>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Forgot password */}
              {mode === "signin" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) {
                        setError("Enter your email first, then click Forgot password.");
                        return;
                      }
                      setLoading(true);
                      setError("");
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        if (error) throw error;
                        setSuccess(true);
                      } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : "Failed to send reset email.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading
                  ? mode === "signin" ? "Signing in..." : "Creating account..."
                  : mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>
          )}

          {/* Toggle mode */}
          {!success && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>
                  No account?{" "}
                  <button
                    onClick={() => switchMode("signup")}
                    className="text-primary font-medium hover:underline"
                  >
                    Create one for free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => switchMode("signin")}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
