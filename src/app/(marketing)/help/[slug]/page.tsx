import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { helpCategories } from "@/data/help-categories";

function findArticle(slug: string) {
  for (const category of helpCategories) {
    for (const article of category.articles) {
      if (article.slug === slug) {
        return { article, category };
      }
    }
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = findArticle(slug);
  if (!result) {
    return { title: "Article Not Found — Know24 Help Center" };
  }
  return {
    title: `${result.article.title} — Know24 Help Center`,
  };
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = findArticle(slug);

  if (!result) {
    notFound();
  }

  const { article, category } = result;

  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-24">
        <Link
          href="/help"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Help Center
        </Link>

        <header className="mt-8">
          <p className="text-sm font-medium text-[#0891b2]">
            {category.name}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
            {article.title}
          </h1>
        </header>

        <div className="mt-12 space-y-6">
          {article.body.split("\n\n").map((paragraph, i) => (
            <p key={i} className="text-base leading-7 text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </>
  );
}
