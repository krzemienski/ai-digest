import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { MiniPlayer } from "@/components/podcast/mini-player";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-pub-bg text-pub-text flex flex-col">
      <PublicHeader />
      <main className="flex-1 pb-20">{children}</main>
      <PublicFooter />
      <MiniPlayer />
    </div>
  );
}
