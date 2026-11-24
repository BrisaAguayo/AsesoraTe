// Hashing de contraseñas con bcrypt (factor de costo 12): nunca se guarda la contraseña en texto plano
import bcrypt from "bcryptjs";

const COSTO = 12;

export const hashContrasena = (contrasena: string) => bcrypt.hash(contrasena, COSTO);
export const compararContrasena = (contrasena: string, hash: string) => bcrypt.compare(contrasena, hash);

// Hash de relleno: se compara aunque el correo no exista, para que el tiempo de respuesta
// no revele qué correos están registrados
export const HASH_RELLENO = "$2b$12$Maf5lb3CnkrLv96J1hyyveW./GXRreso4ybR6Pc7weg8hir9ufCLi";
