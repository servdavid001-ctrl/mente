/* modulo 16 B (fundamento): contratos compartidos del draft */
export type PropuestaFundamento = {
  problema: string;
  debe_hacer: string[];
  no_debe: string[];
  criterio_exito: string[];
  siguiente_paso: string;
};

export type DatosFundamento = {
  nombre: string;
  descripcion: string | null;
  objetivos: string[];
  notas: string[];
};
