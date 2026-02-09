import { ImageResponse } from "next/og";
import { db, queries } from "@ai-digest/db";

export const runtime = "nodejs";

export const alt = "AI Digest Podcast Episode";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "";
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const episode = await queries.getEpisodeById(db, id);

  const title = episode?.title ?? "Episode Not Found";
  const duration = episode?.durationSeconds
    ? formatDuration(episode.durationSeconds)
    : "";
  const date = episode?.createdAt
    ? new Date(String(episode.createdAt)).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#000000",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* RGB accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            display: "flex",
          }}
        >
          <div style={{ flex: 1, backgroundColor: "#EF4444" }} />
          <div style={{ flex: 1, backgroundColor: "#3B82F6" }} />
          <div style={{ flex: 1, backgroundColor: "#22C55E" }} />
        </div>

        {/* Top: Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              color: "#888888",
              letterSpacing: "4px",
              textTransform: "uppercase" as const,
            }}
          >
            AI Digest Podcast
          </div>
        </div>

        {/* Center: Episode title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: title.length > 60 ? "40px" : "48px",
              fontWeight: 700,
              color: "#FAFAFA",
              lineHeight: 1.2,
              letterSpacing: "-1px",
            }}
          >
            {title.length > 90 ? `${title.slice(0, 87)}...` : title}
          </div>
        </div>

        {/* Bottom: Meta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {date && (
            <div style={{ fontSize: "22px", color: "#888888" }}>{date}</div>
          )}
          {duration && (
            <div
              style={{
                fontSize: "22px",
                color: "#22C55E",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {duration}
            </div>
          )}
        </div>

        {/* RGB accent bar at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            display: "flex",
          }}
        >
          <div style={{ flex: 1, backgroundColor: "#EF4444" }} />
          <div style={{ flex: 1, backgroundColor: "#3B82F6" }} />
          <div style={{ flex: 1, backgroundColor: "#22C55E" }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
