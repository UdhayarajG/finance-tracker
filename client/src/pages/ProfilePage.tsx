import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, User, Mail, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation();
  const profileQuery = trpc.auth.getProfile.useQuery();

  // Update form when profile loads
  if (profileQuery.data && !formData.name && profileQuery.data.name) {
    setFormData({
      name: profileQuery.data.name || "",
      email: profileQuery.data.email || "",
      bio: profileQuery.data.bio || "",
    });
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar file must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // For now, create a local data URL for the avatar
      // In production, this would upload to S3 via backend
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        try {
          // Update user profile with avatar URL
          await updateProfileMutation.mutateAsync({
            avatarUrl: dataUrl,
          });
          setSuccess("Avatar updated successfully!");
          setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
          setError("Failed to update avatar. Please try again.");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to upload avatar. Please try again.");
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await updateProfileMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
      });

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-900 dark:text-green-50">Loading...</h2>
        </div>
      </div>
    );
  }

  const userInitials = (user.name || "U")
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-900 dark:text-green-50 mb-2">Profile Settings</h1>
          <p className="text-green-600 dark:text-green-400">Manage your account information and preferences</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Avatar Section */}
        <Card className="mb-6 border-green-200 dark:border-green-800 shadow-lg">
          <CardHeader className="border-b border-green-200 dark:border-green-800">
            <CardTitle className="text-green-900 dark:text-green-50">Profile Picture</CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              Upload a new profile picture
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 border-2 border-green-300 dark:border-green-700">
                <AvatarImage src={user.avatarUrl || ""} alt={user.name || "User"} />
                <AvatarFallback className="bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-50 text-lg font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isLoading}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Picture
                    </>
                  )}
                </Button>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  JPG, PNG or GIF (max. 5MB)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="border-green-200 dark:border-green-800 shadow-lg">
          <CardHeader className="border-b border-green-200 dark:border-green-800">
            <CardTitle className="text-green-900 dark:text-green-50">Personal Information</CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              Update your profile details
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-green-900 dark:text-green-100 font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                  Display Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your name"
                  className="border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500 transition-all"
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-green-900 dark:text-green-100 font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4 text-green-600 dark:text-green-400" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  className="border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500 transition-all"
                  disabled={isLoading}
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-green-900 dark:text-green-100 font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself (max 500 characters)"
                  maxLength={500}
                  rows={4}
                  className="border-green-200 dark:border-green-800 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                  disabled={isLoading}
                />
                <p className="text-xs text-green-600 dark:text-green-400">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
