"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ContactPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    feedback: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    // Send to your email using FormSubmit AJAX API
    // Note: Change "support@fledgeacademy.com" to your actual email address
    try {
      const response = await fetch("https://formsubmit.co/ajax/fledgeacademy@gmail.com", {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          _subject: "New Feedback Submission from Fledge Academy",
          _template: "table" // Beautiful email template
        })
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({
          name: "",
          email: "",
          phone: "",
          feedback: "",
        });
      } else {
        setSubmitStatus("error");
      }
    } catch (err) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant px-gutter py-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-xs cursor-pointer" onClick={() => router.push("/")}>
            <span className="material-symbols-outlined text-primary text-[32px]">school</span>
            <span className="font-headline-md text-headline-md text-primary">Fledge Academy</span>
          </div>
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-xs px-4 py-2 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors text-label-md text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-gutter py-xl">
        <div className="flex flex-col lg:flex-row gap-lg items-stretch">
          
          {/* Contact Information Card */}
          <div className="w-full lg:w-2/5 bg-primary text-white rounded-3xl p-gutter md:p-xl flex flex-col justify-between relative overflow-hidden shadow-lg">
            {/* Decorative background shapes */}
            <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/10 blur-xl"></div>
            <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-white/5 blur-2xl"></div>

            <div className="relative z-10 space-y-lg">
              <div>
                <h1 className="text-headline-lg text-white mb-sm">Get in Touch</h1>
                <p className="text-body-md text-primary-fixed opacity-90">
                  Have questions about our portal, courses, or enrollment? Contact us and we will respond as soon as possible.
                </p>
              </div>

              {/* Office Details */}
              <div className="space-y-md">
                <div className="flex items-start gap-sm">
                  <span className="material-symbols-outlined text-primary-fixed text-[24px] mt-xs">mail</span>
                  <div>
                    <h4 className="text-label-sm text-primary-fixed uppercase tracking-wider">Email Us</h4>
                    <p className="text-body-md font-medium">support@fledgeacademy.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-sm">
                  <span className="material-symbols-outlined text-primary-fixed text-[24px] mt-xs">call</span>
                  <div>
                    <h4 className="text-label-sm text-primary-fixed uppercase tracking-wider">Call Us</h4>
                    <p className="text-body-md font-medium">+ </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Card */}
          <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-3xl p-gutter md:p-xl shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-headline-lg text-on-surface mb-xs">Share Your Feedback</h2>
              <p className="text-body-md text-on-surface-variant mb-lg">
                We value your experience! Please share your thoughts with us.
              </p>

              {submitStatus === "success" && (
                <div className="mb-md p-4 bg-secondary-container text-on-secondary-container rounded-2xl flex items-start gap-sm animate-fade-in">
                  <span className="material-symbols-outlined text-[24px] text-secondary">check_circle</span>
                  <div>
                    <h4 className="font-semibold text-body-md">Feedback Submitted Successfully!</h4>
                    <p className="text-body-sm opacity-90">Thank you for your valuable feedback.</p>
                  </div>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="mb-md p-4 bg-error-container text-on-error-container rounded-2xl flex items-start gap-sm animate-fade-in">
                  <span className="material-symbols-outlined text-[24px]">error</span>
                  <div>
                    <h4 className="font-semibold text-body-md">Submission Failed</h4>
                    <p className="text-body-sm opacity-90">Something went wrong. Please try again.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  {/* Name Input */}
                  <div className="space-y-xs">
                    <label htmlFor="name" className="text-label-md text-on-surface-variant">Full Name</label>
                    <input 
                      type="text" 
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="w-full h-[52px] px-4 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-body-md"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-xs">
                    <label htmlFor="email" className="text-label-md text-on-surface-variant">Email Address</label>
                    <input 
                      type="email" 
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="johndoe@example.com"
                      className="w-full h-[52px] px-4 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-body-md"
                    />
                  </div>
                </div>

                {/* Phone Input */}
                <div className="space-y-xs">
                  <label htmlFor="phone" className="text-label-md text-on-surface-variant">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+1 (555) 000-0000"
                    className="w-full h-[52px] px-4 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-body-md"
                  />
                </div>

                {/* Feedback Input */}
                <div className="space-y-xs">
                  <label htmlFor="feedback" className="text-label-md text-on-surface-variant">Your Feedback</label>
                  <textarea 
                    id="feedback"
                    rows="5"
                    value={formData.feedback}
                    onChange={handleChange}
                    required
                    placeholder="Tell us about your experience..."
                    className="w-full p-4 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-body-md resize-none"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-lg h-[52px] bg-primary text-white text-label-md rounded-xl hover:bg-primary-container transition-all active:scale-[0.98] flex items-center justify-center gap-xs shadow-md shadow-primary/20 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Feedback
                      <span className="material-symbols-outlined">send</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-highest border-t border-outline-variant py-md text-center text-body-sm text-on-surface-variant">
        <p>© 2026 Fledge Academy. All rights reserved.</p>
      </footer>
    </div>
  );
}
