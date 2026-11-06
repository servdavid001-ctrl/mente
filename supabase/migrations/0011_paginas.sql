-- Modulo 13 (paginas/subpaginas estilo Notion, modelo LIGHT): self-reference
-- en ideas.parent_id. RLS intacto (owner-only); cascade al borrar la pagina.
alter table public.ideas add column if not exists parent_id uuid
  references public.ideas(id) on delete cascade;
create index if not exists ideas_parent_id_idx on public.ideas (parent_id);
