import { useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { AlertTriangle, ArrowLeft, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { NotesTab } from '@/features/species/NotesTab';
import { useDeleteSpecies, useSpecies } from '@/features/species/hooks';
import { labelFor } from '@/lib/vocab';

function ComingSoon({ what }: { what: string }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground">{what} — coming in a later phase.</CardContent>
    </Card>
  );
}

function ReferenceTab() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-400" />
        <p className="text-xs text-muted-foreground">
          No reference page generated yet. The AI-generated, citation-aware wiki layer arrives in a later phase. This tab is read-only.
        </p>
      </div>
      <Button disabled className="w-full" variant="outline">
        <Sparkles /> Generate reference page (coming soon)
      </Button>
    </div>
  );
}

export function SpeciesDetailScreen() {
  const { speciesId } = useParams({ strict: false }) as { speciesId: string };
  const { data: species, isLoading } = useSpecies(speciesId);
  const del = useDeleteSpecies();
  const navigate = useNavigate();
  const [tab, setTab] = useState('reference');

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!species) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Species not found.</p>
        <Button asChild variant="outline">
          <Link to="/species">
            <ArrowLeft /> Back to list
          </Link>
        </Button>
      </div>
    );
  }

  const chips: Array<{ key: string; text: string; variant?: 'default' | 'secondary' | 'warning' }> = [];
  if (species.lifecycle) chips.push({ key: 'life', text: labelFor('lifecycle', species.lifecycle), variant: 'secondary' });
  if (species.edibility) chips.push({ key: 'ed', text: labelFor('edibility', species.edibility) });
  if (species.nativeStatus) chips.push({ key: 'ns', text: labelFor('native_status', species.nativeStatus), variant: 'secondary' });
  for (const f of species.safetyFlags) chips.push({ key: `sf-${f}`, text: labelFor('safety_flag', f), variant: 'warning' });

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/species">
          <ArrowLeft /> Species
        </Link>
      </Button>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold italic tracking-tight">{species.scientificName}</h1>
        {species.commonNames.length > 0 && <p className="text-muted-foreground">{species.commonNames.join(', ')}</p>}
        {species.family && <p className="text-sm text-muted-foreground">Family: {species.family}</p>}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {chips.map((c) => (
              <Badge key={c.key} variant={c.variant}>
                {c.text}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="reference">Reference</TabsTrigger>
          <TabsTrigger value="notes">My Notes</TabsTrigger>
          <TabsTrigger value="sightings">Sightings</TabsTrigger>
          <TabsTrigger value="harvests">Harvests</TabsTrigger>
          <TabsTrigger value="preparations">Preparations</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="reference">
          <ReferenceTab />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab speciesId={species.id} />
        </TabsContent>
        <TabsContent value="sightings">
          <ComingSoon what="Sightings" />
        </TabsContent>
        <TabsContent value="harvests">
          <ComingSoon what="Harvests" />
        </TabsContent>
        <TabsContent value="preparations">
          <ComingSoon what="Preparations" />
        </TabsContent>
        <TabsContent value="photos">
          <ComingSoon what="Photos" />
        </TabsContent>
        <TabsContent value="history">
          <ComingSoon what="Reference version history" />
        </TabsContent>
      </Tabs>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive-foreground/80">
            <Trash2 /> Delete species
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this species?</DialogTitle>
            <DialogDescription>
              This permanently removes “{species.scientificName}” and its notes from this device. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => del.mutate(species.id, { onSuccess: () => navigate({ to: '/species' }) })}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
