import { z } from 'zod';

// Password validation schema matching backend requirements
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters")
  .regex(/[A-Z]/, "Must contain at least 1 uppercase letter")
  .regex(/[0-9]/, "Must contain at least 1 number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least 1 special character");

// Password strength calculator
export function calculatePasswordStrength(password) {
  if (!password) return { strength: 0, label: "", color: "", checks: {} };

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    // Bonus: check for extra strength
    lowercase: /[a-z]/.test(password),
    extraNumbers: (password.match(/\d/g) || []).length >= 2,
    extraLength: password.length >= 12,
  };

  const requiredChecks = ['length', 'uppercase', 'numbers', 'special'].map(key => checks[key]).filter(Boolean).length;
  const bonusChecks = ['lowercase', 'extraNumbers', 'extraLength'].map(key => checks[key]).filter(Boolean).length;
  
  const passedChecks = requiredChecks + bonusChecks;
  const maxStrength = 7;

  let strength, label, color;

  if (requiredChecks < 2) {
    strength = 0;
    label = "Very Weak";
    color = "bg-red-500";
  } else if (requiredChecks < 3) {
    strength = 25;
    label = "Weak";
    color = "bg-orange-500";
  } else if (requiredChecks < 4) {
    strength = 50;
    label = "Fair";
    color = "bg-yellow-500";
  } else if (bonusChecks <= 1) {
    strength = 75;
    label = "Good";
    color = "bg-blue-500";
  } else {
    strength = 100;
    label = "Strong";
    color = "bg-green-500";
  }

  return {
    strength,
    label,
    color,
    checks,
    requiredChecks,
    bonusChecks,
    passedChecks,
    isValid: passwordSchema.safeParse(password).success
  };
}

// Password strength indicator component
export function PasswordStrengthIndicator({ password }) {
  const { strength, label, color, checks } = calculatePasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      {/* Progress bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Password Strength:</span>
        <span className={`text-sm font-medium ${
          strength <= 40 ? "text-red-500" :
          strength <= 60 ? "text-orange-500" :
          strength <= 80 ? "text-yellow-500" :
          "text-green-500"
        }`}>
          {label}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${strength}%` }}
        />
      </div>

      {/* Requirements checklist */}
      <div className="mt-3 space-y-1">
        <div className={`text-xs flex items-center font-medium ${checks.length ? "text-green-600" : "text-red-500"}`}>
          {checks.length ? "✅" : "❌"} Minimum 8 characters
        </div>
        <div className={`text-xs flex items-center font-medium ${checks.uppercase ? "text-green-600" : "text-red-500"}`}>
          {checks.uppercase ? "✅" : "❌"} 1 uppercase letter
        </div>
        <div className={`text-xs flex items-center font-medium ${checks.numbers ? "text-green-600" : "text-red-500"}`}>
          {checks.numbers ? "✅" : "❌"} 1 number
        </div>
        <div className={`text-xs flex items-center font-medium ${checks.special ? "text-green-600" : "text-red-500"}`}>
          {checks.special ? "✅" : "❌"} 1 special character
        </div>
        
        {/* Bonus requirements */}
        {password && (
          <>
            <div className="text-xs text-gray-400 flex items-center">
              {checks.lowercase ? "✅" : "○"} Lowercase letter (bonus)
            </div>
            <div className="text-xs text-gray-400 flex items-center">
              {checks.extraNumbers ? "✅" : "○"} 2+ numbers (bonus)
            </div>
            <div className="text-xs text-gray-400 flex items-center">
              {checks.extraLength ? "✅" : "○"} 12+ characters (bonus)
            </div>
          </>
        )}
      </div>
    </div>
  );
}