/**
 * Normaliza números de celular argentinos a un formato canónico de 10
 * dígitos (código de área + número, sin 54 ni 9), para que el login
 * funcione sin importar cómo lo haya tipeado o guardado cada uno:
 * "+54 9 3434 75-5714", "3434755714" o "543434755714" matchean igual.
 */
export function normalizarTelefono(input: string): string {
  const soloDigitos = input.replace(/\D/g, "");

  if (soloDigitos.startsWith("549") && soloDigitos.length >= 12) {
    return soloDigitos.slice(3);
  }
  if (soloDigitos.startsWith("54") && soloDigitos.length >= 11) {
    return soloDigitos.slice(2);
  }
  if (soloDigitos.startsWith("9") && soloDigitos.length === 11) {
    return soloDigitos.slice(1);
  }
  return soloDigitos;
}
