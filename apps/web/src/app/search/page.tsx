import { Container } from "@/components/layout/container";
import { SearchInput } from "@/components/search/search-input";
import { SearchResults } from "@/components/search/search-results";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <Container className="py-8">
      <h1 className="text-2xl font-bold text-accent mb-6">
        Search
      </h1>
      <div className="mb-8">
        <SearchInput defaultValue={q} />
      </div>
      {q ? (
        <SearchResults query={q} />
      ) : (
        <p className="text-center text-text-secondary text-sm py-12">
          Enter a search query to find articles, transcripts, and more.
        </p>
      )}
    </Container>
  );
}
