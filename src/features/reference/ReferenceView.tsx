import { referenceContentSchema, type ReferenceContent } from '@/lib/ai/schema';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Prose({ text }: { text: string }) {
  if (!text?.trim()) return <p className="text-sm text-muted-foreground">—</p>;
  return <p className="text-sm leading-relaxed">{text}</p>;
}

function Bullets({ items }: { items: string[] }) {
  if (!items?.length) return <p className="text-sm text-muted-foreground">—</p>;
  return (
    <ul className="list-disc space-y-0.5 pl-5 text-sm leading-relaxed">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

/** Safely coerce an arbitrary stored content blob into ReferenceContent for rendering. */
export function asReferenceContent(content: unknown): ReferenceContent | null {
  const parsed = referenceContentSchema.safeParse(content);
  return parsed.success ? parsed.data : null;
}

export function ReferenceView({ content }: { content: ReferenceContent }) {
  return (
    <div className="space-y-4">
      <Section title="Summary">
        <Prose text={content.summary} />
      </Section>
      <Section title="Taxonomy">
        <Prose text={content.taxonomy} />
      </Section>
      {content.synonyms.length > 0 && (
        <Section title="Synonyms">
          <Prose text={content.synonyms.join(', ')} />
        </Section>
      )}
      <Section title="Native range">
        <Prose text={content.nativeRange} />
      </Section>
      <Section title="Habitat">
        <Prose text={content.habitat} />
      </Section>
      <Section title="Identifying features">
        <Bullets items={content.identifyingFeatures} />
      </Section>
      <Section title="Lookalikes">
        {content.lookalikes.length ? (
          <ul className="space-y-1 text-sm leading-relaxed">
            {content.lookalikes.map((l, i) => (
              <li key={i}>
                <span className="font-medium italic">{l.name}</span> — {l.distinction}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </Section>
      <Section title="Edibility">
        <Prose text={content.edibility} />
      </Section>
      <Section title="Medicinal actions">
        <Bullets items={content.medicinalActions} />
      </Section>
      <Section title="Constituents">
        <Bullets items={content.constituents} />
      </Section>
      <Section title="Preparations">
        <Bullets items={content.preparations} />
      </Section>
      <Section title="Contraindications">
        <Bullets items={content.contraindications} />
      </Section>
      <Section title="Drug interactions">
        <Bullets items={content.drugInteractions} />
      </Section>
      <Section title="Harvest windows">
        <Prose text={content.harvestWindows} />
      </Section>
      <Section title="Propagation">
        <Prose text={content.propagation} />
      </Section>
      <Section title="Citations">
        {content.citations.length ? (
          <ul className="space-y-0.5 text-sm">
            {content.citations.map((c, i) => (
              <li key={i}>
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noreferrer" className="text-primary underline">
                    {c.title}
                  </a>
                ) : (
                  c.title
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No citations.</p>
        )}
      </Section>
    </div>
  );
}
