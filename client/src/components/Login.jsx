import { useState } from "react";
import { useNavigate } from "react-router";
import { Link2, Mail, Lock, User } from "lucide-react";
import toast from "react-hot-toast";
import { updateData } from "./utils";
import { usePasswordVisibility, EyeIcon } from "./passwordVisibility.jsx";

function Login() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  
  // Password visibility
  const passwordVisibility = usePasswordVisibility(false);

  // Clear any existing local data on login page
  localStorage.clear();
  sessionStorage.clear();

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await toast.promise(
        updateData("api/auth/login", formData),
        {
          loading: "Signing in...",
          success: "Login successful!",
          error: (err) => err.message || "Login failed",
        }
      );

      if (response) {
        // Tokens are stored in cookies automatically by backend
        toast.success("Welcome back!");
        
        // Show success message then redirect
        setTimeout(() => {
          // You can redirect to a dashboard or home page here
          // For now, just reload to see the cookies working
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Link2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Auth</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInput}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={passwordVisibility.type}
                  name="password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInput}
                  required
                />
                <EyeIcon
                  isVisible={passwordVisibility.isVisible}
                  onClick={passwordVisibility.toggle}
                  className="right-3"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="text-center">
            <span className="text-gray-600">Don't have an account? </span>
            <button
              onClick={() => navigate("/register")}
              className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Cookie-based</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Auto-refresh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;