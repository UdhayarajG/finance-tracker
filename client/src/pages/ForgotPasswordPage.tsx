import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft, Check } from "lucide-react";
import { useLocation } from "wouter";

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // In a real implementation, this would call a password reset API endpoint
      // For now, just show success message
      setSubmitted(true);
    } catch (err) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-green-900 dark:text-green-50">Finance Tracker</h1>
          <p className="text-green-600 dark:text-green-400 mt-2">Reset your password</p>
        </div>

        {/* Password Reset Card */}
        <Card className="border-green-200 dark:border-green-800 shadow-lg">
          <CardHeader className="border-b border-green-200 dark:border-green-800">
            <CardTitle className="text-green-900 dark:text-green-50">
              {submitted ? "Check Your Email" : "Forgot Password"}
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              {submitted
                ? "We've sent password reset instructions to your email"
                : "Enter your email address and we'll send you a link to reset your password"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {submitted ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>

                <div className="space-y-3 text-center">
                  <p className="text-green-900 dark:text-green-50 font-semibold">Email sent successfully!</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Check your email for instructions on how to reset your password. The link will expire in 24 hours.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-green-700 dark:text-green-300">Didn't receive the email?</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                    onClick={() => {
                      setSubmitted(false);
                      setEmail("");
                    }}
                  >
                    Try another email
                  </Button>
                </div>

                <Button
                  type="button"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => navigate("/login")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-green-900 dark:text-green-100 font-semibold">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-green-600 dark:text-green-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                {/* Back to Login */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => navigate("/login")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-green-600 dark:text-green-400">
          <p>Need help? Contact our support team</p>
        </div>
      </div>
    </div>
  );
}
