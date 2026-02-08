import { notFound } from "next/navigation";
import { getPersona } from "@/lib/db/personas";
import { getPostsByPersona } from "@/lib/db/posts";
import { isValidPersonaId } from "@/lib/utils/validators";
import PostCard from "@/components/public/PostCard";
import { PersonaId } from "@/types";
import { PERSONA_DISPLAY } from "@/lib/constants/personas";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  if (!isValidPersonaId(slug)) {
    return { title: "Not Found" };
  }

  const info = PERSONA_DISPLAY[slug as PersonaId];
  return {
    title: `${info.blogTitle} | 創作日記`,
    description: info.description,
  };
}

export default async function PersonaPage({ params }: PageProps) {
  const { slug } = await params;

  if (!isValidPersonaId(slug)) {
    notFound();
  }

  const personaId = slug as PersonaId;
  const [persona, posts] = await Promise.all([
    getPersona(personaId),
    getPostsByPersona(personaId, "published", 50),
  ]);

  const info = PERSONA_DISPLAY[personaId];

  return (
    <div>
      <section className={`${info.bgClass} -mx-4 px-4 py-8 mb-8 rounded-lg`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-1">{info.blogTitle}</h1>
          <p className="text-sm text-secondary mb-2">{info.name}</p>
          <p className="text-secondary">
            {persona?.background || info.description}
          </p>
        </div>
      </section>

      {posts.length === 0 ? (
        <p className="text-secondary text-center py-12">
          まだ日記がありません。
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.postId} post={post} showPersona={false} />
          ))}
        </div>
      )}
    </div>
  );
}
