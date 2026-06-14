import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpeciesForm } from '@/features/species/SpeciesForm';
import { useSpecies, useUpdateSpecies } from '@/features/species/hooks';
import type { SpeciesInput } from '@/lib/storage';

export function SpeciesEditScreen() {
  const { speciesId } = useParams({ strict: false }) as { speciesId: string };
  const navigate = useNavigate();
  const { data: species, isLoading } = useSpecies(speciesId);
  const update = useUpdateSpecies(speciesId);

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

  // Strip the server-managed fields to get the editable SpeciesInput.
  const { id: _id, createdAt: _c, updatedAt: _u, ...initial } = species;
  void _id;
  void _c;
  void _u;

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/species/$speciesId" params={{ speciesId }}>
          <ArrowLeft /> Back to species
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit species</h1>
        <p className="text-sm text-muted-foreground">Adjust any field — deselect chips or change dropdowns as new info arises.</p>
      </div>
      <SpeciesForm
        initial={initial as SpeciesInput}
        submitLabel="Update species"
        pending={update.isPending}
        onSubmit={(input) =>
          update.mutate(input, {
            onSuccess: () => navigate({ to: '/species/$speciesId', params: { speciesId } }),
          })
        }
      />
    </div>
  );
}
