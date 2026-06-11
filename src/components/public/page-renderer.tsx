interface Block {
  type: string;
  [key: string]: unknown;
}

interface HeroBlock extends Block {
  type: "hero";
  headline?: string;
  subheadline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
}

interface RichTextBlock extends Block {
  type: "rich-text";
  html?: string;
}

interface FeatureListBlock extends Block {
  type: "feature-list";
  heading?: string;
  features?: { title: string; description?: string; icon?: string }[];
}

interface CtaBlock extends Block {
  type: "cta";
  heading?: string;
  subheading?: string;
  buttonLabel?: string;
  buttonHref?: string;
}

interface FaqBlock extends Block {
  type: "faq";
  heading?: string;
  items?: { question: string; answer: string }[];
}

interface ContactFormBlock extends Block {
  type: "contact-form";
  heading?: string;
  subheading?: string;
}

type KnownBlock =
  | HeroBlock
  | RichTextBlock
  | FeatureListBlock
  | CtaBlock
  | FaqBlock
  | ContactFormBlock;

function HeroRenderer({ block }: { block: HeroBlock }) {
  return (
    <section
      className="relative px-6 py-20 text-center text-white"
      style={{
        background: "linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)",
      }}
    >
      <h1 className="text-4xl font-bold mb-4 max-w-2xl mx-auto">
        {block.headline ?? "Tiêu đề chính"}
      </h1>
      {block.subheadline && (
        <p className="text-lg opacity-85 max-w-xl mx-auto mb-8">
          {block.subheadline}
        </p>
      )}
      {block.ctaLabel && (
        <a
          href={block.ctaHref ?? "#"}
          className="inline-block bg-white text-indigo-700 font-semibold rounded-full px-8 py-3 hover:shadow-lg transition-shadow"
        >
          {block.ctaLabel}
        </a>
      )}
    </section>
  );
}

function RichTextRenderer({ block }: { block: RichTextBlock }) {
  return (
    <section className="max-w-3xl mx-auto px-6 py-12">
      <div
        className="prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: block.html ?? "" }}
      />
    </section>
  );
}

function FeatureListRenderer({ block }: { block: FeatureListBlock }) {
  const features = block.features ?? [];
  return (
    <section className="px-6 py-16 max-w-5xl mx-auto">
      {block.heading && (
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">
          {block.heading}
        </h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            {f.icon && (
              <span className="text-2xl mb-3 block">{f.icon}</span>
            )}
            <h3 className="font-semibold text-slate-800 mb-1">{f.title}</h3>
            {f.description && (
              <p className="text-sm text-slate-500">{f.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaRenderer({ block }: { block: CtaBlock }) {
  return (
    <section className="px-6 py-16 text-center bg-slate-900">
      {block.heading && (
        <h2 className="text-2xl font-bold text-white mb-3">{block.heading}</h2>
      )}
      {block.subheading && (
        <p className="text-slate-400 mb-8 max-w-md mx-auto">{block.subheading}</p>
      )}
      <a
        href={block.buttonHref ?? "/lien-he"}
        className="inline-block bg-indigo-600 text-white font-semibold rounded-full px-8 py-3 hover:bg-indigo-700 transition-colors"
      >
        {block.buttonLabel ?? "Liên hệ ngay"}
      </a>
    </section>
  );
}

function FaqRenderer({ block }: { block: FaqBlock }) {
  const items = block.items ?? [];
  return (
    <section className="px-6 py-16 max-w-3xl mx-auto">
      {block.heading && (
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">
          {block.heading}
        </h2>
      )}
      <div className="space-y-4">
        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="font-semibold text-slate-800 mb-2">{item.question}</p>
            <p className="text-sm text-slate-600">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContactFormRenderer({ block }: { block: ContactFormBlock }) {
  return (
    <section className="px-6 py-16 max-w-xl mx-auto">
      {block.heading && (
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-3">
          {block.heading}
        </h2>
      )}
      {block.subheading && (
        <p className="text-slate-500 text-center mb-8">{block.subheading}</p>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-4">
        <input
          placeholder="Họ tên *"
          className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          placeholder="Số điện thoại"
          className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <textarea
          rows={3}
          placeholder="Nội dung tin nhắn"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <button className="w-full h-10 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
          Gửi liên hệ
        </button>
      </div>
    </section>
  );
}

export function PageRenderer({ blocks }: { blocks: unknown }) {
  if (!Array.isArray(blocks)) return null;

  return (
    <div>
      {(blocks as KnownBlock[]).map((block, i) => {
        switch (block.type) {
          case "hero":
            return <HeroRenderer key={i} block={block as HeroBlock} />;
          case "rich-text":
            return <RichTextRenderer key={i} block={block as RichTextBlock} />;
          case "feature-list":
            return <FeatureListRenderer key={i} block={block as FeatureListBlock} />;
          case "cta":
            return <CtaRenderer key={i} block={block as CtaBlock} />;
          case "faq":
            return <FaqRenderer key={i} block={block as FaqBlock} />;
          case "contact-form":
            return <ContactFormRenderer key={i} block={block as ContactFormBlock} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
