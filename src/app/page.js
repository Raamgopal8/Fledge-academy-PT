"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    // Subtle animation on load
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    // Load saved email if exists
    const savedEmail = localStorage.getItem("loginEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    }

    return () => clearTimeout(timer);
  }, []);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed. Please check your credentials.");
      }

      const data = await response.json();
      
      // Store token and role
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);

      // Redirect based on role
      if (data.role === "ceo") {
        router.push("/ceo/dashboard");
      } else if (data.role === "staff") {
        router.push("/staff/dashboard");
      } else if (data.role === "student") {
        router.push("/dashboard");
      } else {
        router.push("/dashboard");
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side: Visual / Brand Content */}
      <section className="hidden md:flex md:w-1/2 lg:w-3/5 bg-primary relative overflow-hidden flex-col justify-between p-xl">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full opacity-60 mix-blend-overlay"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBJ0GAU17J8iGkX5QBNgVr61Ciy0ElHOU45N_C2_N5vkibBhFwb9ADzGppBvWwAy6U0kJm5T76qQYNopquTP_6QFl5zo_shMI4T4DUH6qPwnAJLyygKObwEFvHtZP59CRDpFS1B0yz6Fh5EqLFUxsAUmF6gYrnydlA8JUhmNJAt5S-cn-Xino6VAt5wHLvyG7LwUcfKNj6Q408r1vg16g53BfpxB0L5Rs0Ep5YQ2wx9SzC_z79YknF3_UkKRiJv5lVvt9-RpPq4-Wjc")',
              backgroundSize: "cover",
              backgroundPosition: "center center",
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/40 to-transparent"></div>
        </div>
        {/* Content Over Image */}
        <div className="relative z-10">
          <div className="flex items-center gap-sm mb-lg">
            <span className="bg-surface-container-lowest text-primary p-2 rounded-xl">
              <span className="material-symbols-outlined text-[32px]">
                school
              </span>
            </span>
            <h1 className="text-display-lg text-white tracking-tight">
              Fledge Academy
            </h1>
          </div>
          <div className="max-w-[448px]">
            <h2 className="text-headline-lg text-white mb-md text-balance">
              Unlock your potential with professional learning.
            </h2>
            <p className="text-body-lg text-primary-fixed opacity-90 leading-relaxed text-justify">
              Join with students mastering new skills daily. From design
              to engineering, start your journey today with neat, smooth, and
              professional resources.
            </p>
          </div>
        </div>
        {/* Footer Stats */}
        <div className="relative z-10 flex gap-xl mt-auto">
          <div>
            <p className="text-headline-md text-white">4.9/5</p>
            <p className="text-label-sm text-primary-fixed uppercase tracking-widest">
              Student Rating
            </p>
          </div>
        </div>
      </section>

      {/* Right Side: Login Form */}
      <section className="flex-1 bg-surface flex items-center justify-center p-gutter md:p-xl">
        <div
          className="w-full max-w-[440px] space-y-xl"
          style={{
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0px)" : "translateY(20px)",
            transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
          }}
        >
          {/* Header */}
          <header className="space-y-sm">
            {/* Mobile Logo */}
            <div className="flex md:hidden items-center gap-xs mb-md">
              <span className="material-symbols-outlined text-primary text-[28px]">
                school
              </span>
              <span className="text-headline-md text-primary">
                Fledge Academy
              </span>
            </div>
            <h2 className="text-headline-lg text-on-surface">Welcome back</h2>
            <p className="text-body-md text-on-surface-variant">
              Please enter your credentials to access your portal.
            </p>
            
            {error && (
              <div className="p-3 bg-error-container text-on-error-container rounded-lg text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">error</span>
                {error}
              </div>
            )}
          </header>

          {/* Login Form */}
          <form
            className="space-y-md"
            id="loginForm"
            onSubmit={handleLogin}
          >
            {/* Email Input */}
            <div className="space-y-xs">
              <label
                className="text-label-md text-on-surface-variant"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">
                  mail
                </span>
                <input
                  className="w-full h-[52px] pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-body-md"
                  id="email"
                  placeholder="Enter your email"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    localStorage.setItem("loginEmail", e.target.value);
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-xs">
              <div className="flex justify-between items-center">
                <label
                  className="text-label-md text-on-surface-variant"
                  htmlFor="password"
                >
                  Password
                </label>
              </div>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">
                  lock
                </span>
                <input
                  className="w-full h-[52px] pl-12 pr-12 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-body-md"
                  id="password"
                  placeholder="Enter your password"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline hover:text-on-surface transition-colors"
                  onClick={togglePassword}
                  type="button"
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              className="w-full h-[56px] bg-primary text-white text-label-md text-[16px] rounded-xl hover:bg-primary-container transition-all active:scale-[0.98] flex items-center justify-center gap-sm shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  Login to Dashboard
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-sm">
            <div className="flex-grow border-t border-outline-variant"></div>
            <div className="flex-grow border-t border-outline-variant"></div>
          </div>

          {/* Registration Link */}
          <footer className="text-center"></footer>
        </div>
      </section>
    </main>
  );
}
