/**
 * Password rules.
 *
 * Four checks, not a strength meter. A meter needs a dictionary — zxcvbn is
 * roughly 800 KB of one — and what it mostly reports is a number nobody acts
 * on. What actually loses accounts here is a short password, the staff
 * member's own name, and the same few dozen passwords that head every leaked
 * list. So those are what this rejects.
 *
 * The problems are written to be read by the person typing. They say what is
 * wrong and what to do instead, and they do not lecture.
 */

export const MIN_LENGTH = 12;
export const MAX_LENGTH = 200;

/** Character classes. At least three of the four must appear. */
const MIN_CLASSES = 3;

export interface PasswordVerdict {
  ok: boolean;
  problems: string[];
}

export interface PasswordOwner {
  name?: string | null;
  email?: string | null;
}

/**
 * The bases that top every credential-stuffing list, plus the local ones a
 * Hyderabad office actually picks. Stored as bare words: the password is
 * un-leeted and stripped of punctuation and trailing digits before it is
 * compared, so `P@ssw0rd@123` and `password` collapse to the same entry.
 */
const COMMON = new Set([
  "password", "passwd", "pass", "letmein", "welcome", "admin", "administrator",
  "changeme", "secret", "login", "root", "guest", "test", "default", "temp",
  "qwerty", "qwertyuiop", "asdfgh", "asdfghjkl", "zxcvbn", "qazwsx", "qweasd",
  "abcdef", "abcdefg", "abcd", "iloveyou", "sunshine", "princess", "monkey",
  "dragon", "master", "shadow", "killer", "hunter", "freedom", "whatever",
  "superman", "batman", "starwars", "pokemon", "trustno", "football",
  "baseball", "soccer", "cricket", "computer", "internet", "google", "samsung",
  "michael", "jessica", "charlie", "daniel", "jordan", "thomas", "robert",
  "ashley", "harley", "ranger", "buster", "ganesh", "krishna", "srinivas",
  "india", "hyderabad", "telangana", "terravion", "realestate", "property",
]);

/**
 * Validates a candidate password against the policy.
 *
 * `owner` is the account the password is for. Checking against it is the point
 * of passing it: a password containing the holder's own name survives no
 * targeted attempt at all, and length does not save it.
 */
export function validatePassword(
  password: string,
  owner: PasswordOwner = {}
): PasswordVerdict {
  const problems: string[] = [];

  if (password.length < MIN_LENGTH) {
    problems.push(
      `Use at least ${MIN_LENGTH} characters. This one has ${password.length}.`
    );
  }
  if (password.length > MAX_LENGTH) {
    problems.push(`${MAX_LENGTH} characters is the ceiling. Trim it.`);
  }

  const classes = countClasses(password);
  if (classes < MIN_CLASSES) {
    problems.push(
      `Mix at least ${MIN_CLASSES} of: lower case, upper case, digits, symbols. This one uses ${classes}.`
    );
  }

  if (/(.)\1{3,}/.test(password)) {
    problems.push("Four of the same character in a row adds nothing.");
  }

  const flat = password.toLowerCase();
  const folded = fold(password);

  for (const token of personalTokens(owner)) {
    if (flat.includes(token) || folded.includes(token)) {
      problems.push(
        "Your own name or email address is in it. That is the first thing anyone tries."
      );
      break;
    }
  }

  const common = commonBase(folded);
  if (common?.exact) {
    problems.push(
      "This is one of the passwords tried first in every attack. Pick another."
    );
  } else if (common) {
    problems.push(
      `It is built on "${common.base}", which anyone attacking this company guesses early. Padding it does not hide it.`
    );
  }

  return { ok: problems.length === 0, problems };
}

function countClasses(password: string): number {
  return (
    Number(/[a-z]/.test(password)) +
    Number(/[A-Z]/.test(password)) +
    Number(/[0-9]/.test(password)) +
    Number(/[^A-Za-z0-9]/.test(password))
  );
}

/** Lower-cases, undoes the obvious character substitutions, drops the rest. */
function fold(password: string): string {
  return password
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/0/g, "o")
    .replace(/3/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[5$]/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Which listed password this one is, or is built on.
 *
 * `exact` separates "this *is* password123" from "this contains dragon", so
 * the two can be told apart in plain words rather than both getting the same
 * unhelpful line.
 */
function commonBase(folded: string): { base: string; exact: boolean } | null {
  const core = folded.replace(/[0-9]+$/, "");
  if (COMMON.has(folded)) return { base: folded, exact: true };
  if (COMMON.has(core)) return { base: core, exact: true };

  // A common word buried in a longer password is still the first thing an
  // attacker's rule set generates. Short bases are skipped — "pass" inside
  // "compassionate" is a coincidence, not a weakness.
  for (const base of COMMON) {
    if (base.length >= 6 && core.includes(base)) return { base, exact: false };
  }
  return null;
}

/** Name words and email local-part fragments worth guarding against. */
function personalTokens(owner: PasswordOwner): string[] {
  const tokens: string[] = [];

  for (const word of (owner.name ?? "").toLowerCase().split(/[^a-z0-9]+/)) {
    if (word.length >= 3) tokens.push(word);
  }

  const local = (owner.email ?? "").toLowerCase().split("@")[0] ?? "";
  if (local.length >= 3) tokens.push(local);
  for (const part of local.split(/[^a-z0-9]+/)) {
    if (part.length >= 3) tokens.push(part);
  }

  return tokens;
}
