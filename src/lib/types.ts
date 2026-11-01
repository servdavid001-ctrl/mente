export type TabId = 'foco' | 'bandeja' | 'biblioteca';

export type IdeaKind = 'texto' | 'voz' | 'link';

// contrato spec: categorized como literal false en modulo 1
export type Idea = {
  id: string;
  text: string;
  kind: IdeaKind;
  sourceUrl?: string;
  createdAt: string;
  categorized: false;
};

// extendido con sourceUrl usado para voz: el CaptureBar sube el audio al bucket
// y entrega `<user_id>/<archivo>.webm` por ese campo (contrato intacto)
export type IdeaPayload = {
  text: string;
  sourceUrl?: string;
  kind: IdeaKind;
};
