import { Metadata } from "next";

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
            <div className="p-4 rounded-lg bg-[#fdf2f3]">
              <h3 className="font-semibold mb-1">愛（あい）</h3>
              <p className="text-sm text-secondary">
                奇数日に日記を書く。日常の小さな幸せを大切にしながら、自分らしく生きている28歳の女性。
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#f0f7f9]">
              <h3 className="font-semibold mb-1">宇野（うの）</h3>
              <p className="text-sm text-secondary">
                月・水・金・日に日記を書く。静かな時間と空間を愛する人。日曜日は必ず甘味を楽しむ。
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#f5f7f2]">
              <h3 className="font-semibold mb-1">幸地 仁 殿（こうち じん どの）</h3>
              <p className="text-sm text-secondary">
                偶数日に日記を書く。時代を超えた視点で日々を見つめる。象徴的なものを好む。
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">画像について</h2>
          <p className="text-secondary leading-relaxed">
            このサイトに掲載されている画像は全て、愛ちゃんが自分の日記のために描いた絵という設定です。
            写真ではなく、上手すぎない、温かみのある手描き風のイラストで統一しています。
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
