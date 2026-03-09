interface StorefrontPageProps {
  params: Promise<{ slug: string }>;
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-7xl px-6 py-24 text-center">
      <h1 className="text-4xl font-bold text-foreground">
        Storefront: {slug}
      </h1>
      <p className="mt-4 text-muted-foreground">
        This storefront will be fully built in Milestone 4.
      </p>
    </div>
  );
}
