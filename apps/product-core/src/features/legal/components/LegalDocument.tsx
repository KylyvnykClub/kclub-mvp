import { Fragment } from 'react';

import { LegalBlock, LegalDoc } from '../types';

function Block({ block }: { block: LegalBlock }) {
  if (block.type === 'paragraph') {
    return <p className="text-sm leading-7 text-muted-foreground sm:text-base">{block.text}</p>;
  }

  if (block.type === 'subheading') {
    return <h3 className="text-base font-bold text-foreground sm:text-lg">{block.text}</h3>;
  }

  return (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground sm:text-base">
      {block.items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <article className="kclub-shell max-w-3xl py-16 sm:py-20">
      <header className="border-b border-border pb-8">
        <h1 className="text-3xl font-black uppercase tracking-[0.01em] text-foreground sm:text-4xl">
          {doc.title}
        </h1>
        <dl className="mt-5 grid gap-1 text-xs uppercase tracking-[0.18em] text-muted">
          <div className="flex gap-2">
            <dt>Effective Date:</dt>
            <dd>{doc.effectiveDate}</dd>
          </div>
          <div className="flex gap-2">
            <dt>Version:</dt>
            <dd>{doc.version}</dd>
          </div>
        </dl>
        {doc.operatorLines && doc.operatorLines.length > 0 && (
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {doc.operatorLines.map((line, index) => (
              <Fragment key={index}>
                {line}
                {index < doc.operatorLines!.length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        )}
      </header>

      {doc.intro && doc.intro.length > 0 && (
        <div className="mt-8 space-y-4">
          {doc.intro.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </div>
      )}

      <div className="mt-10 space-y-10">
        {doc.sections.map((section, index) => (
          <section key={index} className="space-y-4">
            <h2 className="text-lg font-bold text-foreground sm:text-xl">{section.heading}</h2>
            {section.blocks.map((block, blockIndex) => (
              <Block key={blockIndex} block={block} />
            ))}
          </section>
        ))}
      </div>

      {doc.note && (
        <p className="mt-12 border-t border-border pt-6 text-xs leading-6 text-muted">{doc.note}</p>
      )}
    </article>
  );
}
