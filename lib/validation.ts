// Validation utilities for forms

export type ValidationError = string | null;

// ── Amount Validation ────────────────────────────────────────────────────────

export function validateAmount(value: string, balance?: number): ValidationError {
  // Empty check
  if (!value || value.trim() === "") {
    return "amount is required";
  }

  const num = Number(value);

  // Valid number check
  if (isNaN(num)) {
    return "invalid amount";
  }

  // Positive check
  if (num <= 0) {
    return "amount must be positive";
  }

  // Minimum amount (1 ADA)
  if (num < 1) {
    return "minimum 1 ADA";
  }

  // Maximum decimals (6 places for lovelace precision)
  const decimals = value.split(".")[1];
  if (decimals && decimals.length > 6) {
    return "max 6 decimal places";
  }

  // Balance check
  if (balance !== undefined) {
    const lovelace = Math.round(num * 1_000_000);
    if (lovelace > balance) {
      return "insufficient balance";
    }
  }

  return null;
}

// ── Address Validation ───────────────────────────────────────────────────────

export function validateAddress(value: string): ValidationError {
  // Empty check
  if (!value || value.trim() === "") {
    return "address is required";
  }

  const trimmed = value.trim();

  // Length check (Cardano addresses are typically 58-108 characters)
  if (trimmed.length < 58 || trimmed.length > 108) {
    return "invalid address length";
  }

  // Format check (testnet or mainnet)
  if (!trimmed.startsWith("addr_test1") && !trimmed.startsWith("addr1")) {
    return "invalid address format";
  }

  // Basic character check (bech32 only allows certain characters)
  const bech32Regex = /^[a-z0-9]+$/;
  const addressPart = trimmed.split("_").pop() || "";
  if (!bech32Regex.test(addressPart)) {
    return "invalid characters in address";
  }

  return null;
}

// ── Description Validation ───────────────────────────────────────────────────

export function validateDescription(value: string): ValidationError {
  // Empty check
  if (!value || value.trim() === "") {
    return "description is required";
  }

  const trimmed = value.trim();

  // Minimum length
  if (trimmed.length < 5) {
    return "min 5 characters";
  }

  // Maximum length
  if (trimmed.length > 200) {
    return "max 200 characters";
  }

  return null;
}

// ── Dispute Reason Validation ────────────────────────────────────────────────

export function validateDisputeReason(value: string): ValidationError {
  // Empty check
  if (!value || value.trim() === "") {
    return "reason is required";
  }

  const trimmed = value.trim();

  // Minimum length (needs to be meaningful)
  if (trimmed.length < 10) {
    return "min 10 characters (be specific)";
  }

  // Maximum length
  if (trimmed.length > 500) {
    return "max 500 characters";
  }

  return null;
}

// ── Helper: Check if form has any errors ─────────────────────────────────────

export function hasErrors(errors: Record<string, ValidationError>): boolean {
  return Object.values(errors).some((error) => error !== null);
}
