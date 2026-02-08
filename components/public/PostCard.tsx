import Link from "next/link";
import Image from "next/image";
import { Post } from "@/types";
import { formatDateDisplay } from "@/lib/utils/date";
import { personaNames } from "@/lib/constants/personas";

interface PostCardProps {
  post: Post;
  showPersona?: boolean;
}

export default function PostCard({ post, showPersona = true }: PostCardProps) {
  const excerpt = getExcerpt(post);

  return (
    <article className={`card overflow-hidden persona-${post.personaId}`}>
      <Link href={`/post/${post.postId}`} className="block">
        {post.image?.url && (
          <div className="relative aspect-[16/9] bg-muted">
            <Image
              src={post.image.url}
              alt={post.title}
              fill
              className="object-cover diary-image"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-secondary mb-2">
            <time>{formatDateDisplay(post.dateKey)}</time>
            {showPersona && (
              <>
                <span>·</span>
                <span
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: "var(--persona-bg)",
                    color: "var(--persona-color)",
                  }}
                >
                  {personaNames[post.personaId]}
                </span>
              </>
            )}
          </div>
          <h2 className="text-lg font-semibold mb-2 text-foreground">
            {post.title}
          </h2>
          <p className="text-secondary text-sm line-clamp-2">{excerpt}</p>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-muted rounded-full text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}

function getExcerpt(post: Post): string {
  const firstTextSection = post.content.sections.find(
    (s) => s.type === "text" && s.text
  );
  if (firstTextSection?.text) {
    return firstTextSection.text.slice(0, 120) + (firstTextSection.text.length > 120 ? "..." : "");
  }
  return "";
}
