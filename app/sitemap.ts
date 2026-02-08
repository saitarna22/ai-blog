import { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/db/posts";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/archive`, changeFrequency: "daily", priority: 0.6 },
  ];

  const personaPages: MetadataRoute.Sitemap = ["ai", "uno", "kochi"].map(
    (id) => ({
      url: `${BASE_URL}/p/${id}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })
  );

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/post/${post.postId}`,
    lastModified: post.publishedAt || post.createdAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...personaPages, ...postPages];
}
