interface FAQItem {
  question: string;
  answer: string;
}

interface PersonMarkup {
  name: string;
  jobTitle?: string;
  url?: string;
  image?: string;
  description?: string;
}

interface ProductMarkup {
  name: string;
  description: string;
  price: number;
  currency?: string;
  url: string;
  image?: string;
}

interface OrganizationMarkup {
  name: string;
  url: string;
  logo?: string;
  description?: string;
}

export function generateFAQSchema(faqs: FAQItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generatePersonSchema(person: PersonMarkup): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    ...(person.jobTitle && { jobTitle: person.jobTitle }),
    ...(person.url && { url: person.url }),
    ...(person.image && { image: person.image }),
    ...(person.description && { description: person.description }),
  };
}

export function generateProductSchema(product: ProductMarkup): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(product.image && { image: product.image }),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency ?? "USD",
      url: product.url,
      availability: "https://schema.org/InStock",
    },
  };
}

export function generateOrganizationSchema(org: OrganizationMarkup): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    url: org.url,
    ...(org.logo && { logo: org.logo }),
    ...(org.description && { description: org.description }),
  };
}
