import type { LegalBlock, LegalSection } from "@/lib/legal/config";

function renderBlock(block: LegalBlock, index: number) {
  switch (block.type) {
    case "p":
      return <p key={index}>{block.text}</p>;
    case "ps":
      return block.texts.map((text, i) => (
        <p key={`${index}-${i}`}>{text}</p>
      ));
    case "ul":
      return (
        <ul key={index}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={index}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    case "h3":
      return <h3 key={index}>{block.text}</h3>;
    default:
      return null;
  }
}

type LegalDocumentProps = {
  title: string;
  lastUpdated: string;
  intro?: string;
  disclaimer: string;
  sections: LegalSection[];
};

export function LegalDocument({
  title,
  lastUpdated,
  intro,
  disclaimer,
  sections,
}: LegalDocumentProps) {
  return (
    <article className="container mx-auto px-4 py-16 md:px-6 max-w-3xl prose prose-slate dark:prose-invert">
      <h1>{title}</h1>
      <p className="text-sm text-muted-foreground not-prose">
        Last updated: {lastUpdated}
      </p>
      <div className="rounded-lg border bg-muted/40 p-4 text-sm not-prose my-6">
        <p className="text-muted-foreground m-0">{disclaimer}</p>
      </div>
      {intro ? <p>{intro}</p> : null}
      {sections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2>{section.title}</h2>
          {section.blocks.map((block, index) => renderBlock(block, index))}
        </section>
      ))}
    </article>
  );
}
