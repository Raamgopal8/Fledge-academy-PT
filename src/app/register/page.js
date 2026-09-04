'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [isLoaded, setIsLoaded] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        dob: '',
        terms_accepted: false
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!formData.name.trim()) {
            setError('Please enter your full name.');
            return;
        }

        if (!formData.email.trim() || !formData.email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }

        if (!formData.password || formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (!formData.phone.trim()) {
            setError('Please enter your phone number.');
            return;
        }

        if (!/^\d{10}$/.test(formData.phone.trim())) {
            setError('Phone number must be exactly 10 digits.');
            return;
        }

        if (!formData.dob) {
            setError('Please enter your date of birth.');
            return;
        }

        if (!formData.terms_accepted) {
            setError('You must agree to the Terms of Service and Privacy Policy to register.');
            return;
        }

        setIsLoading(true);

        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
            const res = await fetch(`${apiBase}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password,
                    phone: formData.phone.trim(),
                    dob: formData.dob,
                    level: 'Level 5',
                    batch: 'Batch - 1',
                    terms_accepted: formData.terms_accepted
                })
            });

            if (!res.ok) {
                let errorMsg = 'Registration failed. Please try again.';
                try {
                    const errData = await res.json();
                    errorMsg = errData.detail || errorMsg;
                } catch (_) {
                    errorMsg = `Server error (${res.status}). Please try again in a few moments.`;
                }
                throw new Error(errorMsg);
            }

            let data;
            try {
                data = await res.json();
            } catch (_) {
                throw new Error('Invalid response from server. Please try again.');
            }

            // Save login credentials to localStorage
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('level', data.level || 'Level 5');
            localStorage.setItem('batch', data.batch || 'Batch - 1');
            localStorage.setItem('userName', data.name || formData.name);
            localStorage.setItem('userEmail', data.email || formData.email);
            localStorage.setItem('loginEmail', formData.email.trim().toLowerCase());

            setSuccessMessage('Account created successfully! Redirecting to your dashboard...');
            
            setTimeout(() => {
                router.push('/dashboard');
            }, 1200);

        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col lg:flex-row bg-background">
            {/* Left Side: Visual / Brand Content */}
            <section className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-primary relative overflow-hidden flex-col justify-between p-10 xl:p-14 shrink-0 min-w-[420px]">
                {/* Background Image Layer */}
                <div className="absolute inset-0 z-0">
                    <div
                        className="w-full h-full opacity-50 mix-blend-overlay"
                        style={{
                            backgroundImage:
                                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBJ0GAU17J8iGkX5QBNgVr61Ciy0ElHOU45N_C2_N5vkibBhFwb9ADzGppBvWwAy6U0kJm5T76qQYNopquTP_6QFl5zo_shMI4T4DUH6qPwnAJLyygKObwEFvHtZP59CRDpFS1B0yz6Fh5EqLFUxsAUmF6gYrnydlA8JUhmNJAt5S-cn-Xino6VAt5wHLvyG7LwUcfKNj6Q408r1vg16g53BfpxB0L5Rs0Ep5YQ2wx9SzC_z79YknF3_UkKRiJv5lVvt9-RpPq4-Wjc")',
                            backgroundSize: "cover",
                            backgroundPosition: "center center",
                        }}
                    />
                </div>
                
                {/* Gradient Overlay for Depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-transparent z-0 opacity-90" />

                {/* Top Brand Header */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 p-1.5 shadow-md">
                        <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-2xl text-white font-extrabold tracking-tight">
                        Fledge Academy
                    </span>
                </div>

                {/* Center / Inspiring Copy */}
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

                {/* Left Bottom Footer Meta */}
                <div className="relative z-10 flex items-center justify-between text-xs text-white/80 border-t border-white/15 pt-4">
                    <span>© 2026 Fledge Academy. All rights reserved.</span>
                    <span className="text-white/60">Fledge Academy Portal</span>
                </div>
            </section>

            {/* Right Side: Registration Form */}
            <section className="flex-1 flex flex-col justify-center items-center px-6 py-10 md:px-12 bg-background relative z-10 overflow-y-auto min-h-screen">
                <div className={`w-full max-w-[460px] space-y-5 transition-all duration-700 ${
                    isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}>
                    
                    {/* Header */}
                    <div className="space-y-1">
                        <div className="lg:hidden flex items-center gap-2.5 mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20 p-1.5 shadow-sm">
                                <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xl font-bold text-on-surface">
                                Fledge Academy
                            </span>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
                            Create an account
                        </h2>
                        <p className="text-xs text-on-surface-variant">
                            Already have an account?{" "}
                            <Link href="/" className="text-primary font-bold hover:underline">
                                Log in
                            </Link>
                        </p>
                    </div>

                    {/* Feedback Alerts */}
                    {error && (
                        <div className="p-4 bg-error/10 border border-error/30 rounded-2xl text-error text-xs font-medium space-y-2 animate-fade-in shadow-2xs">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[20px] text-error">error</span>
                                <span className="font-bold text-xs">Registration Verification</span>
                            </div>
                            <p className="text-on-surface-variant text-xs leading-relaxed pl-7">
                                {error}
                            </p>
                            {error.includes('fledgeacademy@gmail.com') && (
                                <div className="pl-7 pt-1">
                                    <a 
                                        href="mailto:fledgeacademy@gmail.com?subject=Enrolled%20Student%20Registration%20Request" 
                                        className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 transition-all text-xs"
                                    >
                                        <span className="material-symbols-outlined text-[15px]">mail</span>
                                        <span>Contact fledgeacademy@gmail.com</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {successMessage && (
                        <div className="p-3.5 bg-green-500/10 border border-green-500/30 rounded-xl text-green-700 dark:text-green-400 text-xs font-medium flex items-center gap-2 animate-fade-in">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Full Name */}
                        <div className="space-y-1">
                            <label className="text-label-md text-on-surface-variant font-medium block" htmlFor="name">
                                Full Name *
                            </label>
                            <div className="relative group">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">
                                    person
                                </span>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full h-[48px] pl-11 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-xs text-on-surface"
                                />
                            </div>
                        </div>

                        {/* Email Address */}
                        <div className="space-y-1">
                            <label className="text-label-md text-on-surface-variant font-medium block" htmlFor="email">
                                Email Address *
                            </label>
                            <div className="relative group">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">
                                    mail
                                </span>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full h-[48px] pl-11 pr-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-xs text-on-surface"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-label-md text-on-surface-variant font-medium block" htmlFor="password">
                                Password *
                            </label>
                            <div className="relative group">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">
                                    lock
                                </span>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="At least 6 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full h-[48px] pl-11 pr-11 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-xs text-on-surface"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Phone Number & Date of Birth Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Phone */}
                            <div className="space-y-1">
                                <label className="text-label-md text-on-surface-variant font-medium block" htmlFor="phone">
                                    Phone Number *
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">
                                        call
                                    </span>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        required
                                        placeholder=" "
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full h-[48px] pl-11 pr-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-xs text-on-surface"
                                    />
                                </div>
                            </div>

                            {/* Date of Birth */}
                            <div className="space-y-1">
                                <label className="text-label-md text-on-surface-variant font-medium block" htmlFor="dob">
                                    Date of Birth *
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">
                                        calendar_today
                                    </span>
                                    <input
                                        id="dob"
                                        name="dob"
                                        type="date"
                                        required
                                        value={formData.dob}
                                        onChange={handleChange}
                                        className="w-full h-[48px] pl-11 pr-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-xs text-on-surface"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Terms & Privacy Agreement Checkbox */}
                        <div className="pt-1">
                            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-on-surface-variant leading-relaxed select-none">
                                <input
                                    type="checkbox"
                                    name="terms_accepted"
                                    checked={formData.terms_accepted}
                                    onChange={handleChange}
                                    className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 shrink-0 cursor-pointer"
                                />
                                <span>
                                    I agree to the{" "}
                                    <Link href="/terms" target="_blank" className="text-primary font-semibold hover:underline">
                                        Terms & Conditions  
                                    </Link>{" "}
                                    and{" "}
                                    <Link href="/privacy" target="_blank" className="text-primary font-semibold hover:underline">
                                        Privacy Policy
                                    </Link>.
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-[52px] bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mt-2"
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Back to Login Link */}
                    <div className="pt-2 text-center">
                        <p className="text-xs text-on-surface-variant">
                            Already registered?{" "}
                            <Link href="/" className="text-primary font-bold hover:underline">
                                Sign In to Dashboard
                            </Link>
                        </p>
                    </div>

                    {/* Social Links */}
                    <div className="pt-2 space-y-4">
                        <div className="relative flex items-center">
                            <div className="flex-grow border-t border-outline-variant"></div>
                            <span className="flex-shrink-0 mx-3 text-on-surface-variant text-[11px] font-medium uppercase tracking-wider">Connect with us</span>
                            <div className="flex-grow border-t border-outline-variant"></div>
                        </div>
                        
                        <div className="flex justify-center gap-5">
                            <a href="https://chat.whatsapp.com/LJCMHmRk4n66iR7smHksxJ" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center transition-all duration-300 hover:scale-110 hover:border-[#25D366] hover:bg-[#25D366]/20 shadow-xs group" title="WhatsApp">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                            </a>
                            <a href="https://www.instagram.com/fledge_academy" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center transition-all duration-300 hover:scale-110 hover:border-[#E1306C] hover:bg-[#E1306C]/20 shadow-xs group" title="Instagram">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" alt="Instagram" className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                            </a>
                            <a href="https://www.youtube.com/@fledgeacademy" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center transition-all duration-300 hover:scale-110 hover:border-[#FF0000] hover:bg-[#FF0000]/20 shadow-xs group" title="YouTube">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg" alt="YouTube" className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                            </a>
                            <a href="https://www.linkedin.com/company/fledgeacademy" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center transition-all duration-300 hover:scale-110 hover:border-[#0077B5] hover:bg-[#0077B5]/20 shadow-xs group" title="LinkedIn">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg" alt="LinkedIn" className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                            </a>
                        </div>
                    </div>

                </div>
            </section>
        </main>
    );
}
