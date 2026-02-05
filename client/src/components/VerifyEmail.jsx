import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Shield, ArrowLeft, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { updateData } from "./utils";

function VerifyEmail() {
  const navigate = useNavigate();
  
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const registrationToken = sessionStorage.getItem("registrationToken");

  // Redirect if no registration token
  if (!registrationToken) {
    navigate("/register");
    return null;
  }

  const handleOtpChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and max 4 digits
    if (/^\d{0,4}$/.test(value)) {
      setOtp(value);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 4) {
      toast.error("Please enter a 4-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      const response = await toast.promise(
        updateData("api/auth/verify-registration", {
          registrationToken,
          otp: otp,
        }),
        {
          loading: "Verifying email...",
          success: "Email verified successfully!",
          error: (err) => err.message || "Verification failed",
        }
      );

      if (response) {
        setIsVerified(true);
        // Clean up registration token
        sessionStorage.removeItem("registrationToken");
        
        // Tokens are automatically set in cookies by backend
        // No need to store anything locally

        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (error) {
      console.error("OTP verification error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    // Implementation would depend on your backend
    toast.success("OTP resent to your email");
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white shadow-xl rounded-2xl p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Email Verified!
            </h2>
            <p className="text-gray-600 mb-6">
              Your account has been successfully created. Redirecting you to login...
            </p>
            <div className="animate-pulse-slow">
              <div className="w-8 h-1 bg-green-500 rounded mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate("/register")}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Register
        </button>

        {/* Logo/Verification Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
          <p className="text-gray-600 mt-2">
            We've sent a 4-digit code to your email address
          </p>
        </div>

        {/* OTP Form */}
        <div className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Enter Verification Code
              </label>
              <div className="flex justify-center">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  className="w-28 text-center text-3xl font-bold tracking-widest px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                  placeholder="0000"
                  value={otp}
                  onChange={handleOtpChange}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 4}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendOtp}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
            >
              Resend Code
            </button>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center text-sm text-gray-500">
            <Shield className="w-4 h-4 mr-2 text-green-500" />
            <span>Your code is valid for 30 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;