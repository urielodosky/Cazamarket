export const isValidCuit = (cuit: string): boolean => {
  if (!cuit) return false;

  // Remove all non-numeric characters (dashes, spaces, dots, etc.)
  const cleanCuit = cuit.replace(/\D/g, '');

  if (cleanCuit.length !== 11) return false;

  const [a, b, c, d, e, f, g, h, i, j, k] = cleanCuit.split('').map(Number);

  // The formula for Modulo 11 in Argentina CUIT:
  // Multiply each of the first 10 digits by the sequence 5, 4, 3, 2, 7, 6, 5, 4, 3, 2
  const sum = 
    a * 5 + 
    b * 4 + 
    c * 3 + 
    d * 2 + 
    e * 7 + 
    f * 6 + 
    g * 5 + 
    h * 4 + 
    i * 3 + 
    j * 2;

  const rest = sum % 11;
  let verifier = rest === 0 ? 0 : rest === 1 ? 9 : 11 - rest;

  if (rest === 1) {
    if (a === 2 && b === 0) {
      verifier = 9;
    } else if (a === 2 && b === 7) {
      verifier = 4;
    }
  }

  return verifier === k;
};
