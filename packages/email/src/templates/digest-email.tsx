import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Link,
  Hr,
  Preview,
} from "@react-email/components";
import * as React from "react";

export interface DigestEmailItem {
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  compositeScore: number;
}

export interface DigestEmailSection {
  topic: string;
  items: DigestEmailItem[];
}

export interface DigestEmailProps {
  digestDate: string;
  synthesis: string;
  sections: DigestEmailSection[];
  unsubscribeUrl: string;
}

const SOURCE_COLORS: Record<string, string> = {
  hackernews: "#f97316",
  github: "#22c55e",
  arxiv: "#ef4444",
  rss: "#3b82f6",
  huggingface: "#eab308",
  reddit: "#f97316",
  producthunt: "#f97316",
};

function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] ?? "#3b82f6";
}

function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function DigestEmail({
  digestDate,
  synthesis,
  sections,
  unsubscribeUrl,
}: DigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>AI Digest — {digestDate}</Preview>
      <Body
        style={{
          backgroundColor: "#09090B",
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "20px",
          }}
        >
          {/* Header */}
          <Section style={{ padding: "20px 0", textAlign: "center" as const }}>
            <Text
              style={{
                color: "#FAFAFA",
                fontSize: "28px",
                fontWeight: "bold",
                margin: "0 0 4px 0",
                letterSpacing: "1px",
              }}
            >
              AI Digest
            </Text>
            <Text
              style={{
                color: "#A1A1AA",
                fontSize: "14px",
                margin: 0,
              }}
            >
              {digestDate}
            </Text>
          </Section>

          <Hr style={{ borderColor: "#3F3F46", margin: "0 0 20px 0" }} />

          {/* Editorial Synthesis */}
          <Section
            style={{
              backgroundColor: "#18181B",
              borderLeft: "3px solid #3b82f6",
              padding: "16px 20px",
              marginBottom: "24px",
              borderRadius: "0 4px 4px 0",
            }}
          >
            <Text
              style={{
                color: "#3b82f6",
                fontSize: "12px",
                fontWeight: "bold",
                textTransform: "uppercase" as const,
                letterSpacing: "1px",
                margin: "0 0 8px 0",
              }}
            >
              Editorial Synthesis
            </Text>
            <Text
              style={{
                color: "#FAFAFA",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              {synthesis}
            </Text>
          </Section>

          {/* Topic Sections */}
          {sections.map((section, sIdx) => (
            <Section key={sIdx} style={{ marginBottom: "24px" }}>
              <Text
                style={{
                  color: "#FAFAFA",
                  fontSize: "16px",
                  fontWeight: "bold",
                  textTransform: "uppercase" as const,
                  letterSpacing: "1px",
                  margin: "0 0 12px 0",
                  borderBottom: "1px solid #1a1a1a",
                  paddingBottom: "8px",
                }}
              >
                {section.topic}
              </Text>

              {section.items.map((item, iIdx) => (
                <Section
                  key={iIdx}
                  style={{
                    backgroundColor: "#18181B",
                    border: "1px solid #1a1a1a",
                    borderRadius: "4px",
                    padding: "12px 16px",
                    marginBottom: "8px",
                  }}
                >
                  <Row>
                    <Column style={{ width: "100%" }}>
                      <Link
                        href={item.sourceUrl}
                        style={{
                          color: "#FAFAFA",
                          fontSize: "14px",
                          fontWeight: "bold",
                          textDecoration: "none",
                        }}
                      >
                        {item.title}
                      </Link>
                    </Column>
                  </Row>
                  <Row style={{ marginTop: "6px" }}>
                    <Column style={{ width: "100%" }}>
                      <Text
                        style={{
                          color: "#A1A1AA",
                          fontSize: "13px",
                          lineHeight: "1.4",
                          margin: 0,
                        }}
                      >
                        {item.summary}
                      </Text>
                    </Column>
                  </Row>
                  <Row style={{ marginTop: "8px" }}>
                    <Column>
                      <Text
                        style={{
                          color: getSourceColor(item.source),
                          fontSize: "11px",
                          fontWeight: "bold",
                          textTransform: "uppercase" as const,
                          margin: 0,
                          display: "inline",
                        }}
                      >
                        {item.source}
                      </Text>
                    </Column>
                    <Column style={{ textAlign: "right" as const }}>
                      <Text
                        style={{
                          color: "#3b82f6",
                          fontSize: "11px",
                          margin: 0,
                        }}
                      >
                        Score: {formatScore(item.compositeScore)}
                      </Text>
                    </Column>
                  </Row>
                </Section>
              ))}
            </Section>
          ))}

          {/* Footer */}
          <Hr style={{ borderColor: "#3F3F46", margin: "20px 0" }} />
          <Section style={{ textAlign: "center" as const, padding: "10px 0" }}>
            <Text
              style={{
                color: "#71717A",
                fontSize: "12px",
                margin: "0 0 8px 0",
              }}
            >
              You&apos;re receiving this because you subscribed to AI Digest.
            </Text>
            <Link
              href={unsubscribeUrl}
              style={{
                color: "#A1A1AA",
                fontSize: "12px",
                textDecoration: "underline",
              }}
            >
              Unsubscribe
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default DigestEmail;
