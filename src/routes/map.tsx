import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useSpeciesList } from '@/features/species/hooks';
import { useAllHarvests, useAllSightings } from '@/features/dashboard/hooks';

interface Find {
  id: string;
  lat: number;
  lng: number;
  speciesId: string;
  kind: 'Sighting' | 'Harvest';
  date: string;
}

export function FindsMapScreen() {
  const { data: species = [] } = useSpeciesList();
  const { data: sightings = [] } = useAllSightings();
  const { data: harvests = [] } = useAllHarvests();

  const nameOf = useMemo(() => {
    const m = new Map(species.map((s) => [s.id, s.scientificName]));
    return (id: string) => m.get(id) ?? 'Unknown';
  }, [species]);

  const finds = useMemo<Find[]>(() => {
    const out: Find[] = [];
    for (const s of sightings)
      if (s.lat != null && s.lng != null)
        out.push({ id: `s-${s.id}`, lat: s.lat, lng: s.lng, speciesId: s.speciesId, kind: 'Sighting', date: s.seenAt?.slice(0, 10) });
    for (const h of harvests)
      if (h.lat != null && h.lng != null)
        out.push({ id: `h-${h.id}`, lat: h.lat, lng: h.lng, speciesId: h.speciesId, kind: 'Harvest', date: h.harvestedAt?.slice(0, 10) });
    return out;
  }, [sightings, harvests]);

  const bounds = useMemo(
    () => (finds.length ? L.latLngBounds(finds.map((f) => [f.lat, f.lng] as [number, number])).pad(0.2) : undefined),
    [finds],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Map of finds</h1>

      {finds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <MapPin className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No located finds yet. Log a sighting or harvest with GPS or coordinates and it'll appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="h-[70vh] overflow-hidden rounded-md border">
          <MapContainer
            bounds={bounds}
            center={bounds ? undefined : [20, 0]}
            zoom={bounds ? undefined : 2}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {finds.map((f) => (
              <CircleMarker
                key={f.id}
                center={[f.lat, f.lng]}
                radius={8}
                pathOptions={{ color: '#1f6f43', fillColor: '#2fae6b', fillOpacity: 0.8 }}
              >
                <Popup>
                  <div className="space-y-1">
                    <Link to="/species/$speciesId" params={{ speciesId: f.speciesId }} className="font-medium italic text-primary underline">
                      {nameOf(f.speciesId)}
                    </Link>
                    <p className="text-xs">
                      {f.kind} · {f.date}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
