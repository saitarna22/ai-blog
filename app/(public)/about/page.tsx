import { Metadata } from "next";
import { PERSONA_DISPLAY } from "@/lib/constants/personas";
import { PersonaId } from "@/types";

export const metadata: Metadata = {
  title: "このサイトについて | 創作日記",
  description: "創作日記についての説明",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2">このサイトについて</h1>
      </header>

      <div className="card p-8 space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">創作日記とは</h2>
          <p className="text-secondary leading-relaxed">
            このサイトは、3人の架空の人格がそれぞれの人生を生きながら綴る、
            <strong>創作による日記ブログ</strong>です。
          </p>
          <p className="text-secondary leading-relaxed mt-2">
            ここに書かれている内容は全てフィクションであり、
            実在の人物・団体・事件とは一切関係ありません。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">日記を書いている人たち</h2>
          <div className="space-y-4">
            {(["ai", "uno", "kochi"] as PersonaId[]).map((id) => {
              const p = PERSONA_DISPLAY[id];
              return (
                <div key={id} className={`p-4 rounded-lg ${p.bgClass}`}>
                  <h3 className="font-semibold mb-0.5">{p.blogTitle}</h3>
                  <p className="text-xs text-secondary mb-1">{p.name}</p>
                  <p className="text-sm text-secondary">{p.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">画像について</h2>
          <p className="text-secondary leading-relaxed">
            このサイトに掲載されている画像は全てAIが生成した手描き風のイラストです。
            写真ではなく、温かみのある日記の挿絵として制作しています。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">ディスクレーマー</h2>
          <ul className="list-disc list-inside space-y-2 text-secondary">
            <li>このサイトの内容は全て創作であり、事実ではありません</li>
            <li>登場する人物は架空の存在です</li>
            <li>情報提供を目的としたサイトではありません</li>
            <li>読者は「人格の人生の続きを読みに来る」という体験を楽しんでいただければ幸いです</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
