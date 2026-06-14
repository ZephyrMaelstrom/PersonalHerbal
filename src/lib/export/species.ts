import { getStore } from '@/lib/storage';
import { labelFor } from '@/lib/vocab';
import { referenceContentSchema, type ReferenceContent } from '@/lib/ai/schema';
import type { Species } from '@/lib/storage';
import type { ExportArtifact, SpeciesExport } from './types';

interface Section {
  h: string;
  body?: string;
  items?: string[];
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'species';
}

async function gather(speciesId: string): Promise<{ species: Species; ref: ReferenceContent | null } | null> {
  const species = await getStore().species.get(speciesId);
  if (!species) return null;
  const current = await getStore().reference.current(speciesId);
  const parsed = current ? referenceContentSchema.safeParse(current.content) : null;
  return { species, ref: parsed && parsed.success ? parsed.data : null };
}

function buildSections(species: Species, ref: ReferenceContent | null): Section[] {
  const out: Section[] = [];
  const facts: string[] = [];
  if (species.family) facts.push(`Family: ${species.family}`);
  if (species.lifecycle) facts.push(`Lifecycle: ${labelFor('lifecycle', species.lifecycle)}`);
  if (species.nativeStatus) facts.push(`Native status: ${labelFor('native_status', species.nativeStatus)}`);
  if (species.edibility) facts.push(`Edibility: ${labelFor('edibility', species.edibility)}`);
  if (species.actions.length) facts.push(`Actions: ${species.actions.map((a) => labelFor('action', a)).join(', ')}`);
  if (species.safetyFlags.length) facts.push(`Safety: ${species.safetyFlags.map((f) => labelFor('safety_flag', f)).join(', ')}`);
  if (facts.length) out.push({ h: 'At a glance', items: facts });

  if (ref) {
    if (ref.summary) out.push({ h: 'Summary', body: ref.summary });
    if (ref.identifyingFeatures.length) out.push({ h: 'Identifying features', items: ref.identifyingFeatures });
    if (ref.habitat) out.push({ h: 'Habitat', body: ref.habitat });
    if (ref.lookalikes.length) out.push({ h: 'Lookalikes', items: ref.lookalikes.map((l) => `${l.name} — ${l.distinction}`) });
    if (ref.edibility) out.push({ h: 'Edibility', body: ref.edibility });
    if (ref.medicinalActions.length) out.push({ h: 'Medicinal actions', items: ref.medicinalActions });
    if (ref.preparations.length) out.push({ h: 'Preparations', items: ref.preparations });
    if (ref.contraindications.length) out.push({ h: 'Contraindications', items: ref.contraindications });
    if (ref.drugInteractions.length) out.push({ h: 'Drug interactions', items: ref.drugInteractions });
    if (ref.harvestWindows) out.push({ h: 'Harvest windows', body: ref.harvestWindows });
    if (ref.citations.length) out.push({ h: 'Sources', items: ref.citations.map((c) => (c.url ? `${c.title} (${c.url})` : c.title)) });
  }
  return out;
}

function header(species: Species): { title: string; subtitle: string } {
  return { title: species.scientificName, subtitle: species.commonNames.join(', ') };
}

function renderMarkdown(species: Species, sections: Section[]): string {
  const { title, subtitle } = header(species);
  const parts = [`# ${title}`, subtitle ? `*${subtitle}*` : ''];
  for (const s of sections) {
    parts.push(`\n## ${s.h}`);
    if (s.body) parts.push(s.body);
    if (s.items) parts.push(s.items.map((i) => `- ${i}`).join('\n'));
  }
  parts.push('\n---\n_Shared from Verdant Codex. Reference information, not medical advice._');
  return parts.filter(Boolean).join('\n');
}

function renderText(species: Species, sections: Section[]): string {
  const { title, subtitle } = header(species);
  const parts = [title, subtitle, '='.repeat(title.length)];
  for (const s of sections) {
    parts.push(`\n${s.h.toUpperCase()}`);
    if (s.body) parts.push(s.body);
    if (s.items) parts.push(s.items.map((i) => `  • ${i}`).join('\n'));
  }
  parts.push('\n— Shared from Verdant Codex. Reference information, not medical advice.');
  return parts.filter(Boolean).join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] ?? c);
}

function renderHtml(species: Species, sections: Section[]): string {
  const { title, subtitle } = header(species);
  const body = sections
    .map((s) => {
      const inner = s.body
        ? `<p>${escapeHtml(s.body)}</p>`
        : `<ul>${(s.items ?? []).map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
      return `<section><h2>${escapeHtml(s.h)}</h2>${inner}</section>`;
    })
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><style>
body{font-family:Georgia,'Times New Roman',serif;max-width:42rem;margin:2rem auto;padding:0 1.25rem;color:#1a1a1a;line-height:1.6}
h1{font-style:italic;margin-bottom:0}h2{margin-top:1.5rem;font-size:1.05rem;text-transform:uppercase;letter-spacing:.04em;color:#2f6f43}
.sub{color:#555;margin-top:.25rem}ul{padding-left:1.2rem}footer{margin-top:2rem;color:#777;font-size:.85rem;border-top:1px solid #ddd;padding-top:1rem}
</style></head><body><h1>${escapeHtml(title)}</h1>${subtitle ? `<p class="sub">${escapeHtml(subtitle)}</p>` : ''}${body}
<footer>Shared from Verdant Codex. Reference information, not medical advice.</footer></body></html>`;
}

async function ctxArtifact(
  speciesId: string,
  ext: string,
  mime: string,
  render: (s: Species, sec: Section[]) => string,
): Promise<ExportArtifact | null> {
  const data = await gather(speciesId);
  if (!data) return null;
  const content = render(data.species, buildSections(data.species, data.ref));
  return { filename: `${slug(data.species.scientificName)}.${ext}`, mime, content };
}

/**
 * Outreach document formats for a single species. Designed to grow: add a format here (e.g.
 * a one-page field card, a social summary, a slide) and it appears in the share menu.
 * Planned future formats: collection field-guide PDF, image "plant card", social caption.
 */
export const SPECIES_FORMATS: SpeciesExport[] = [
  {
    id: 'print',
    label: 'Print / Save as PDF',
    group: 'document',
    kind: 'print',
    build: (id) => ctxArtifact(id, 'html', 'text/html', renderHtml),
  },
  {
    id: 'markdown',
    label: 'Markdown (.md)',
    group: 'document',
    kind: 'file',
    build: (id) => ctxArtifact(id, 'md', 'text/markdown', renderMarkdown),
  },
  {
    id: 'text',
    label: 'Plain text (.txt)',
    group: 'document',
    kind: 'file',
    build: (id) => ctxArtifact(id, 'txt', 'text/plain', renderText),
  },
  {
    id: 'html',
    label: 'Web page (.html)',
    group: 'document',
    kind: 'file',
    build: (id) => ctxArtifact(id, 'html', 'text/html', renderHtml),
  },
];
