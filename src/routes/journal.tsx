import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { NotebookPen, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/inputs/Field';
import { useToast } from '@/components/ui/toast';
import { useSpeciesList } from '@/features/species/hooks';
import { SpeciesMultiSelect } from '@/features/journal/SpeciesMultiSelect';
import { useCreateJournalEntry, useDeleteJournalEntry, useJournal } from '@/features/journal/hooks';

const today = () => new Date().toISOString().slice(0, 10);

export function JournalScreen() {
  const { data: entries = [], isLoading } = useJournal();
  const { data: species = [] } = useSpeciesList();
  const create = useCreateJournalEntry();
  const del = useDeleteJournalEntry();
  const { toast } = useToast();

  const nameOf = useMemo(() => {
    const m = new Map(species.map((s) => [s.id, s.scientificName]));
    return (id: string) => m.get(id) ?? id;
  }, [species]);

  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(today());
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [speciesIds, setSpeciesIds] = useState<string[]>([]);

  function reset() {
    setDate(today());
    setTitle('');
    setBody('');
    setSpeciesIds([]);
    setAdding(false);
  }

  async function submit() {
    if (!body.trim() && !title.trim()) return;
    await create.mutateAsync({ date, title: title.trim() || undefined, body, speciesIds });
    reset();
  }

  function remove(e: (typeof entries)[number]) {
    del.mutate(e.id);
    toast({
      message: 'Entry deleted',
      actionLabel: 'Undo',
      onAction: () => create.mutate({ date: e.date, title: e.title, body: e.body, speciesIds: e.speciesIds }),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus /> New entry
          </Button>
        )}
      </div>

      {adding && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">New entry</h3>
              <Button variant="ghost" size="icon" onClick={reset}>
                <X />
              </Button>
            </div>
            <Field label="Date" htmlFor="jdate">
              <Input id="jdate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Entry">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="What happened today…" />
            </Field>
            <Field label="Tagged species">
              <SpeciesMultiSelect value={speciesIds} onChange={setSpeciesIds} />
            </Field>
            <Button onClick={submit} disabled={create.isPending}>
              {create.isPending ? 'Saving…' : 'Save entry'}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : entries.length === 0 && !adding ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <NotebookPen className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No journal entries yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <Card key={e.id}>
              <CardContent className="space-y-1.5 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{e.date}</p>
                    {e.title && <p className="font-medium">{e.title}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 text-destructive-foreground/70" onClick={() => remove(e)}>
                    <Trash2 />
                  </Button>
                </div>
                {e.body && <p className="whitespace-pre-wrap text-sm leading-relaxed">{e.body}</p>}
                {e.speciesIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {e.speciesIds.map((id) => (
                      <Link key={id} to="/species/$speciesId" params={{ speciesId: id }}>
                        <Badge variant="secondary" className="italic">
                          {nameOf(id)}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
