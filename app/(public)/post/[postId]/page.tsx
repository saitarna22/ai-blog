import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPost } from "@/lib/db/posts";
import { formatDateDisplay } from "@/lib/utils/date";
import { personaNames, PERSONA_DISPLAY } from "@/lib/constants/personas";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ postId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { postId } = await params;
  const post = await getPost(postId);

  if (!post || post.status !== "published") {
    return { title: "Not Found" };
  }

  const title = `${post.title} | ${PERSONA_DISPLAY[post.personaId].blogTitle}`;
  const description = getExcerpt(post);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      ...(post.image?.url && {
        images: [{ url: post.image.url }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(post.image?.url && {
        images: [post.image.url],
      }),
    },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { postId } = await params;
  const post = await getPost(postId);

  if (!post || post.status !== "published") {
    notFound();
  }

  return (
    <article className={`persona-${post.personaId}`}>
      <header className="mb-8">
        <div className="flex items-center gap-3 text-sm text-secondary mb-4">
          <time>{formatDateDisplay(post.dateKey)}</time>
          <span>·</span>
          <Link
            href={`/p/${post.personaId}`}
            className="px-3 py-1 rounded-full hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: "var(--persona-bg)",
              color: "var(--persona-color)",
            }}
          >
            {personaNames[post.personaId]}
          </Link>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-4">{post.title}</h1>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-sm px-3 py-1 bg-muted rounded-full text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {post.image?.url && (
        <div className="relative aspect-[16/9] mb-8 rounded-lg overflow-hidden">
          <Image
            src={post.image.url}
            alt={post.title}
            fill
            className="object-cover diary-image"
            priority
          />
        </div>
      )}

      <div className="post-content">
        {post.content.sections.map((section, index) => (
          <section key={section.key || index} className="mb-8">
            {section.title && (
              <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
            )}
            {section.type === "text" && section.text && (
              <div className="whitespace-pre-wrap">{section.text}</div>
            )}
            {section.type === "bullets" && section.bullets && (
              <ul>
                {section.bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <footer className="mt-12 pt-8 border-t border-border">
        <div className="flex items-center justify-between">
          <Link href={`/p/${post.personaId}`} className="text-sm text-secondary hover:text-accent">
            ← {PERSONA_DISPLAY[post.personaId].blogTitle}
          </Link>
          <Link href={`/d/${post.dateKey}`} className="text-sm text-secondary hover:text-accent">
            この日の日記 →
          </Link>
        </div>
      </footer>
    </article>
  );
}

function getExcerpt(post: { content: { sections: { type: string; text?: string }[] } }): string {
  const firstTextSection = post.content.sections.find(
    (s) => s.type === "text" && s.text
  );
  if (firstTextSection?.text) {
    return firstTextSection.text.slice(0, 160);
  }
  return "";
}
