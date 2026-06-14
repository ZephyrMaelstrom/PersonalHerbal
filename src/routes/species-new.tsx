import { useNavigate } from '@tanstack/react-router';
import { SpeciesForm } from '@/features/species/SpeciesForm';
import { useCreateSpecies } from '@/features/species/hooks';

export function SpeciesNewScreen() {
  const navigate = useNavigate();
  const create = useCreateSpecies();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New species</h1>
        <p className="text-sm text-muted-foreground">Dropdown-first. Only the scientific name is required.</p>
      </div>
      <SpeciesForm
        pending={create.isPending}
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: (created) =>
              navigate({ to: '/species/$speciesId', params: { speciesId: created.id } }),
          })
        }
      />
    </div>
  );
}
