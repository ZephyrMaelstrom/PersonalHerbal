import { useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { SightingsTab } from '@/features/sightings/SightingsTab';
import { HarvestsTab } from '@/features/harvests/HarvestsTab';
import { PreparationsTab } from '@/features/preparations/PreparationsTab';
import { PhotosTab } from '@/features/photos/PhotosTab';
import { ReferenceTab } from '@/features/reference/ReferenceTab';
import { HistoryTab } from '@/features/reference/HistoryTab';
import { SpeciesPhotoThumb } from '@/features/photos/SpeciesPhotoThumb';
import { AskDialog } from '@/features/companion/AskDialog';
import { SpeciesExportDialog } from '@/features/export/SpeciesExportDialog';
import { useDeleteSpecies, useSpecies } from '@/features/species/hooks';
import { labelFor } from '@/lib/vocab';

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

  // Linkable chips deep-link into a pre-filtered species list (materia-medica cross-linking).
  type Chip = {
    key: string;
    text: string;
    variant?: 'default' | 'secondary' | 'warning';
    search?: Record<string, string>;
  };
  const chips: Chip[] = [];
  if (species.lifecycle) chips.push({ key: 'life', text: labelFor('lifecycle', species.lifecycle), variant: 'secondary' });
  if (species.edibility)
    chips.push({ key: 'ed', text: labelFor('edibility', species.edibility), search: { edibility: species.edibility } });
  if (species.nativeStatus)
    chips.push({ key: 'ns', text: labelFor('native_status', species.nativeStatus), variant: 'secondary', search: { nativeStatus: species.nativeStatus } });
  for (const f of species.safetyFlags)
    chips.push({ key: `sf-${f}`, text: labelFor('safety_flag', f), variant: 'warning', search: { safetyFlag: f } });
  for (const a of species.actions)
    chips.push({ key: `ac-${a}`, text: labelFor('action', a), variant: 'secondary', search: { action: a } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/species">
            <ArrowLeft /> Species
          </Link>
        </Button>
        <div className="flex gap-2">
          <AskDialog species={species} />
          <SpeciesExportDialog speciesId={species.id} />
          <Button asChild variant="outline" size="sm">
            <Link to="/species/$speciesId/edit" params={{ speciesId: species.id }}>
              <Pencil /> Edit
            </Link>
          </Button>
        </div>
      </div>

      <header className="space-y-2">
        <div className="flex items-start gap-3">
          <SpeciesPhotoThumb photoId={species.mainPhotoId} className="size-20" />
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-2xl font-semibold italic leading-tight tracking-tight">{species.scientificName}</h1>
            {species.commonNames.length > 0 && <p className="text-muted-foreground">{species.commonNames.join(', ')}</p>}
            {species.family && <p className="text-sm text-muted-foreground">Family: {species.family}</p>}
          </div>
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {chips.map((c) =>
              c.search ? (
                <Link key={c.key} to="/species" search={c.search}>
                  <Badge variant={c.variant}>{c.text}</Badge>
                </Link>
              ) : (
                <Badge key={c.key} variant={c.variant}>
                  {c.text}
                </Badge>
              ),
            )}
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
          <ReferenceTab speciesId={species.id} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab speciesId={species.id} />
        </TabsContent>
        <TabsContent value="sightings">
          <SightingsTab speciesId={species.id} />
        </TabsContent>
        <TabsContent value="harvests">
          <HarvestsTab speciesId={species.id} />
        </TabsContent>
        <TabsContent value="preparations">
          <PreparationsTab speciesId={species.id} />
        </TabsContent>
        <TabsContent value="photos">
          <PhotosTab speciesId={species.id} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab speciesId={species.id} />
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
