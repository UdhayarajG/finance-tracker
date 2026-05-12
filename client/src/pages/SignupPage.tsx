import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, Mail, Lock, User, ArrowRight, Check, X } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export default function SignupPage() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const getPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "text-red-600 dark:text-red-400" };
    if (score <= 2) return { score: 2, label: "Fair", color: "text-orange-600 dark:text-orange-400" };
    if (score <= 3) return { score: 3, label: "Good", color: "text-yellow-600 dark:text-yellow-400" };
    return { score: 4, label: "Strong", color: "text-green-600 dark:text-green-400" };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;
  const isFormValid = formData.name && formData.email && passwordsMatch && agreedToTerms;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    if (passwordStrength.score < 2) {
      setError("Password is too weak. Please use a stronger password");
      return;
    }

    setIsLoading(true);

    try {
      // For now, redirect to OAuth signup
      // In a real implementation, this would call a signup API endpoint
      window.location.href = getLoginUrl();
    } catch (err) {
      setError("Failed to create account. Please try again.");
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
          <p className="text-green-600 dark:text-green-400 mt-2">Get started today</p>
        </div>

        {/* Signup Card */}
        <Card className="border-green-200 dark:border-green-800 shadow-lg">
          <CardHeader className="border-b border-green-200 dark:border-green-800">
            <CardTitle className="text-green-900 dark:text-green-50">Create Account</CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              Sign up to start tracking your finances
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-green-900 dark:text-green-100 font-semibold">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-green-600 dark:text-green-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-green-900 dark:text-green-100 font-semibold">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-green-600 dark:text-green-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength.score === 1
                            ? "w-1/4 bg-red-500"
                            : passwordStrength.score === 2
                            ? "w-2/4 bg-orange-500"
                            : passwordStrength.score === 3
                            ? "w-3/4 bg-yellow-500"
                            : "w-full bg-green-500"
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-green-900 dark:text-green-100 font-semibold">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-green-600 dark:text-green-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 pr-10 border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <div className="flex items-center gap-2">
                    {passwordsMatch ? (
                      <>
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs text-green-600 dark:text-green-400">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-xs text-red-600 dark:text-red-400">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Terms & Conditions */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 mt-1 rounded border-green-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-green-700 dark:text-green-300">
                  I agree to the{" "}
                  <button type="button" className="font-semibold text-green-600 dark:text-green-400 hover:underline">
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button type="button" className="font-semibold text-green-600 dark:text-green-400 hover:underline">
                    Privacy Policy
                  </button>
                </span>
              </label>

              {/* Signup Button */}
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 transition-all"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {/* OAuth Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Sign up with GitHub
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-green-700 dark:text-green-300">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                >
                  Sign in
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-green-600 dark:text-green-400">
          <p>Join thousands of users managing their finances</p>
        </div>
      </div>
    </div>
  );
}
