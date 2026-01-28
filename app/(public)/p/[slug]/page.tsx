import { notFound } from "next/navigation";
import { getPersona } from "@/lib/db/personas";
import { getPostsByPersona } from "@/lib/db/posts";
import { isValidPersonaId } from "@/lib/utils/validators";
import PostCard from "@/components/public/PostCard";
import { PersonaId } from "@/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const personaInfo: Record<PersonaId, { name: string; description: string; bgClass: string }> = {
  ai: {
    name: "愛",
    description: "28歳の女性。日常の小さな幸せを大切にしながら、自分らしく生きている。",
    bgClass: "bg-[#fdf2f3]",
  },
  uno: {
    name: "宇野",
    description: "静かな時間と空間を愛する人。日曜日は必ず甘味を楽しむ。",
    bgClass: "bg-[#f0f7f9]",
  },
  kochi: {
    name: "幸地 仁 殿",
    description: "時代を超えた視点で日々を見つめる。象徴的なものを好む。",
    bgClass: "bg-[#f5f7f2]",
  },
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  if (!isValidPersonaId(slug)) {
    return { title: "Not Found" };
  }

  const info = personaInfo[slug];
  return {
    title: `${info.name}の日記 | 創作日記`,
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

  const info = personaInfo[personaId];

  return (
    <div>
      <section className={`${info.bgClass} -mx-4 px-4 py-8 mb-8 rounded-lg`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{info.name}の日記</h1>
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
