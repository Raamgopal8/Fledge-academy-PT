"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth as firebaseAuth, googleProvider, db as firestoreDb } from "@/lib/firebase";

export default function TempLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const router = useRouter();

  // Helper to sync authenticated Firebase user into MongoDB & Firestore and store session
  const completeAuthSession = async (user, fallbackName = "") => {
    const idToken = await user.getIdToken();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

    // 1. Sync with backend MongoDB
    try {
      const response = await fetch(`${apiBase}/api/auth/firebase-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || fallbackName || user.email.split("@")[0].title(),
          photo_url: user.photoURL || "",
          firebase_uid: user.uid,
          id_token: idToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("level", data.level || "Level 5");
        localStorage.setItem("batch", data.batch || "");
        localStorage.setItem("userName", data.name || user.displayName || fallbackName || "");
        localStorage.setItem("userEmail", data.email || user.email || "");
        localStorage.setItem("userProfileImage", data.profile_image_url || user.photoURL || "");

        // 2. Mirror into Firestore
        try {
          const userDocRef = doc(firestoreDb, "users", user.uid);
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || data.name || fallbackName || "",
            photoURL: user.photoURL || data.profile_image_url || "",
            role: data.role || "student",
            level: data.level || "Level 5",
            batch: data.batch || "Batch - 1",
            lastLogin: serverTimestamp(),
            authProvider: user.providerData?.[0]?.providerId || "password",
          }, { merge: true });
        } catch (fsErr) {
          console.warn("Firestore sync notice:", fsErr);
        }

        // 3. Navigate to dashboard
        const userRole = (data.role || "").toLowerCase();
        if (userRole === "admin" || userRole === "ceo") {
          router.push("/admin/dashboard");
        } else if (userRole === "sensi" || userRole === "staff") {
          router.push("/sensi/dashboard");
        } else {
          router.push("/dashboard");
        }
        return;
      }
    } catch (e) {
      console.warn("MongoDB sync fallback notice:", e);
    }

    // Fallback if backend API offline: navigate to student dashboard
    localStorage.setItem("token", idToken);
    localStorage.setItem("role", "student");
    localStorage.setItem("userEmail", user.email || "");
    router.push("/dashboard");
  };

  const handleFirebaseEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      let userCredential;
      if (mode === "signin") {
        // Sign in with Firebase Email & Password
        userCredential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      } else {
        // Create account with Firebase Email & Password
        userCredential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
        setSuccess("Account created successfully!");
      }

      await completeAuthSession(userCredential.user);
    } catch (err) {
      let msg = err.message;
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        msg = "Invalid email or password. Please try again.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "This email address is already registered. Please sign in instead.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setIsGoogleLoading(true);

    try {
      const userCredential = await signInWithPopup(firebaseAuth, googleProvider);
      await completeAuthSession(userCredential.user);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setError(err.message || "Google sign in failed.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-[440px] bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Header with Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            Firebase Authentication
          </div>
          <h1 className="text-2xl font-bold text-on-surface">
            {mode === "signin" ? "Sign In with Firebase" : "Create Firebase Account"}
          </h1>
          <p className="text-sm text-on-surface-variant">
            Enter your Firebase email address and password to continue.
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 bg-surface-container-low p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(""); }}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === "signin" 
                ? "bg-surface-container-lowest text-primary shadow-xs" 
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === "signup" 
                ? "bg-surface-container-lowest text-primary shadow-xs" 
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="p-3 bg-error-container text-on-error-container rounded-xl text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 rounded-xl text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{success}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleFirebaseEmailAuth} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant" htmlFor="fb-email">
              Firebase Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px]">
                mail
              </span>
              <input
                id="fb-email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant" htmlFor="fb-password">
              Firebase Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px]">
                lock
              </span>
              <input
                id="fb-password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-11 pr-11 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full h-12 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary-container transition-all active:scale-[0.98] shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            ) : (
              <>
                <span>{mode === "signin" ? "Sign In with Email" : "Create Account"}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-outline-variant/60"></div>
          <span className="flex-shrink-0 mx-3 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider opacity-70">
            Or
          </span>
          <div className="flex-grow border-t border-outline-variant/60"></div>
        </div>

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full h-12 bg-surface-container-lowest border border-outline-variant hover:border-primary/50 hover:bg-surface-container-low transition-all active:scale-[0.98] flex items-center justify-center gap-3 rounded-xl font-semibold text-sm text-on-surface shadow-xs disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isGoogleLoading ? (
            <span className="material-symbols-outlined animate-spin text-primary text-[20px]">progress_activity</span>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Back to Standard Portal Login Link */}
        <div className="pt-2 text-center">
          <Link
            href="/"
            className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to standard portal login
          </Link>
        </div>
      </div>
    </main>
  );
}
