import db from "./db";

export type Cliente = {
  id: number;
  nombre: string;
  ciudad: string | null;
  lista_difusion: string | null;
  creado_en: string;
};

export async function listarClientes(): Promise<Cliente[]> {
  return (await db.prepare("SELECT * FROM clientes ORDER BY nombre").all()) as Cliente[];
}
