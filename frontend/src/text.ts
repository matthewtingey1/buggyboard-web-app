// Matches the API: a value made only of whitespace or characters that render as nothing is blank.
const INVISIBLE = /[\p{Default_Ignorable_Code_Point}\u2800]/gu;

export function isBlank(value: string): boolean {
  return value.replace(INVISIBLE, "").trim() === "";
}
