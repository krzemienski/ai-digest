import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "All Episodes — AI Digest Podcast";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000000",
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

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              fontSize: "32px",
              color: "#888888",
              letterSpacing: "4px",
              textTransform: "uppercase" as const,
            }}
          >
            AI Digest
          </div>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 700,
              color: "#FAFAFA",
              letterSpacing: "-1px",
            }}
          >
            All Episodes
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#555555",
            }}
          >
            Browse the full AI Digest podcast archive
          </div>
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
