/**
 * Safe regex patterns for input validation
 * Prevents malicious content injection
 */

// Safe username pattern - allows alphanumeric, underscore, hyphen
export const SAFE_USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

// Safe name pattern - allows letters, spaces, hyphens, apostrophes
export const SAFE_NAME_REGEX = /^[a-zA-Z\s'-]+$/;

// Safe content pattern - allows most characters but blocks dangerous ones
export const SAFE_CONTENT_REGEX = /^[^<>{}[\]\\]*$/;

// Safe password pattern - allows common password characters
export const SAFE_PASSWORD_REGEX =
  /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;

// Safe ID pattern - alphanumeric and specific characters
export const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

// Safe OTP pattern - only numbers
export const SAFE_OTP_REGEX = /^\d{4}$/;

// Custom validator function for express-validator
export const safeRegexValidator = (regex, message) => {
  return (value) => {
    if (value && !regex.test(value)) {
      throw new Error(message);
    }
    return true;
  };
};

// Predefined validators for common use cases
export const validateUsername = safeRegexValidator(
  SAFE_USERNAME_REGEX,
  "Username can only contain letters, numbers, underscores, and hyphens",
);

export const validateName = safeRegexValidator(
  SAFE_NAME_REGEX,
  "Name can only contain letters, spaces, hyphens, and apostrophes",
);

export const validateContent = safeRegexValidator(
  SAFE_CONTENT_REGEX,
  "Content contains invalid characters. HTML tags and brackets are not allowed",
);

export const validatePassword = safeRegexValidator(
  SAFE_PASSWORD_REGEX,
  "Password contains invalid characters",
);

export const validateId = safeRegexValidator(
  SAFE_ID_REGEX,
  "ID contains invalid characters",
);

export const validateSearchQuery = safeRegexValidator(
  SAFE_CONTENT_REGEX,
  "Content contains invalid characters. HTML tags and brackets are not allowed",
);

export const validateOTP = safeRegexValidator(
  SAFE_OTP_REGEX,
  "OTP contains invalid characters",
);
