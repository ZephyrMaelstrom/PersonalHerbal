import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getStore } from '@/lib/storage';
import { useSpeciesList } from '@/features/species/hooks';
import { useJournal } from '@/features/journal/hooks';

interface Result {
  key: string;
  kind: 'Species' | 'Note' | 'Journal' | 'Reference';
  title: string;
  snippet: string;
  speciesId?: string;
}

const store = getStore();

export function SearchScreen() {
  const [q, setQ] = useState('');
  const { data: species = [] } = useSpeciesList();
  const { data: journal = [] } = useJournal();
  const { data: notes = [] } = useQuery({ queryKey: ['notes-all'], queryFn: () => store.notes.listAll() });
  const { data: references = [] } = useQuery({ queryKey: ['reference-current-all'], queryFn: () => store.reference.listCurrent() });

  const nameOf = useMemo(() => {
    const m = new Map(species.map((s) => [s.id, s.scientificName]));
    return (id: string) => m.get(id) ?? 'Unknown';
  }, [species]);

  const results = useMemo<Result[]>(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const out: Result[] = [];

    for (const s of species) {
      const hay = [s.scientificName, ...s.commonNames, s.family ?? ''].join(' ').toLowerCase();
      if (hay.includes(query))
        out.push({ key: `sp-${s.id}`, kind: 'Species', title: s.scientificName, snippet: s.commonNames.join(', '), speciesId: s.id });
    }
    for (const n of notes) {
      const hay = [n.freeNotes, n.tasteNotes, n.smellNotes, ...n.customTags].join(' ').toLowerCase();
      if (hay.includes(query)) {
        const text = [n.freeNotes, n.tasteNotes, n.smellNotes].find((t) => t.toLowerCase().includes(query)) ?? '';
        out.push({ key: `nt-${n.speciesId}`, kind: 'Note', title: nameOf(n.speciesId), snippet: text.slice(0, 120), speciesId: n.speciesId });
      }
    }
    for (const j of journal) {
      const hay = `${j.title ?? ''} ${j.body}`.toLowerCase();
      if (hay.includes(query)) out.push({ key: `jn-${j.id}`, kind: 'Journal', title: j.title || j.date, snippet: j.body.slice(0, 120) });
    }
    for (const r of references) {
      const text = JSON.stringify(r.content).toLowerCase();
      if (text.includes(query)) {
        const summary = typeof (r.content as { summary?: unknown }).summary === 'string' ? String((r.content as { summary?: unknown }).summary) : '';
        out.push({ key: `rf-${r.id}`, kind: 'Reference', title: nameOf(r.speciesId), snippet: summary.slice(0, 120), speciesId: r.speciesId });
      }
    }
    return out;
  }, [q, species, notes, journal, references, nameOf]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search species, notes, journal, references…"
          className="pl-9"
        />
      </div>

      {q.trim().length >= 2 && (
        <p className="text-xs text-muted-foreground">
          {results.length} result{results.length === 1 ? '' : 's'}
        </p>
      )}

      <div className="space-y-2">
        {results.map((r) => {
          const inner = (
            <Card className={r.speciesId ? 'transition-colors hover:border-primary/50' : undefined}>
              <CardContent className="space-y-1 p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{r.kind}</Badge>
                  <p className="min-w-0 flex-1 truncate font-medium italic">{r.title}</p>
                </div>
                {r.snippet && <p className="line-clamp-2 text-sm text-muted-foreground">{r.snippet}</p>}
              </CardContent>
            </Card>
          );
          return r.speciesId ? (
            <Link key={r.key} to="/species/$speciesId" params={{ speciesId: r.speciesId }}>
              {inner}
            </Link>
          ) : (
            <Link key={r.key} to="/journal">
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
