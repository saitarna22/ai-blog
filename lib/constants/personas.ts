import { PersonaId } from "@/types";

export const PERSONA_DISPLAY: Record<PersonaId, {
  name: string;
  blogTitle: string;
  shortName: string;
  description: string;
  bgClass: string;
  bgColor: string;
}> = {
  ai: {
    name: "高橋 愛",
    blogTitle: "愛のひとりごと",
    shortName: "愛",
    description: "28歳のUIデザイナー。東京・下北沢で保護猫「もち」と一人暮らし。お弁当作りと古着屋巡りが趣味。",
    bgClass: "bg-[#fdf2f3]",
    bgColor: "#fdf2f3",
  },
  uno: {
    name: "宇野 康二",
    blogTitle: "宇野の散歩日和",
    shortName: "宇野",
    description: "63歳、元中学校国語教師。京都・北白川で妻と穏やかな日々を過ごす。散歩と甘味処巡りが日課。",
    bgClass: "bg-[#f0f7f9]",
    bgColor: "#f0f7f9",
  },
  kochi: {
    name: "幸地 仁",
    blogTitle: "珍道中BLOG",
    shortName: "幸地",
    description: "35歳のフリーランス・トラベルライター。沖縄出身、日本各地を放浪中。ローカル鉄道とB級グルメに目がない。",
    bgClass: "bg-[#f5f7f2]",
    bgColor: "#f5f7f2",
  },
};

/** 後方互換のためのヘルパー */
export const personaNames: Record<PersonaId, string> = {
  ai: PERSONA_DISPLAY.ai.shortName,
  uno: PERSONA_DISPLAY.uno.shortName,
  kochi: PERSONA_DISPLAY.kochi.shortName,
};
