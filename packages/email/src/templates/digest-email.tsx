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
  hackernews: "#FF6600",
  github: "#00FF88",
  arxiv: "#B31B1B",
  rss: "#00FFFF",
  huggingface: "#FFD21E",
  reddit: "#FF4500",
  producthunt: "#DA552F",
};

function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] ?? "#00FFFF";
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
          backgroundColor: "#0D0D14",
          fontFamily:
            "'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', 'Courier New', monospace",
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
                color: "#00FFFF",
                fontSize: "28px",
                fontWeight: "bold",
                margin: "0 0 4px 0",
                letterSpacing: "2px",
              }}
            >
              AI DIGEST
            </Text>
            <Text
              style={{
                color: "#F0F0F5",
                fontSize: "14px",
                margin: 0,
                opacity: 0.7,
              }}
            >
              {digestDate}
            </Text>
          </Section>

          <Hr style={{ borderColor: "#1a1a2e", margin: "0 0 20px 0" }} />

          {/* Editorial Synthesis */}
          <Section
            style={{
              backgroundColor: "#12121f",
              borderLeft: "3px solid #00FFFF",
              padding: "16px 20px",
              marginBottom: "24px",
              borderRadius: "0 4px 4px 0",
            }}
          >
            <Text
              style={{
                color: "#00FFFF",
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
                color: "#F0F0F5",
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
                  color: "#00FF88",
                  fontSize: "16px",
                  fontWeight: "bold",
                  textTransform: "uppercase" as const,
                  letterSpacing: "1px",
                  margin: "0 0 12px 0",
                  borderBottom: "1px solid #1a1a2e",
                  paddingBottom: "8px",
                }}
              >
                {section.topic}
              </Text>

              {section.items.map((item, iIdx) => (
                <Section
                  key={iIdx}
                  style={{
                    backgroundColor: "#12121f",
                    border: "1px solid #1a1a2e",
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
                          color: "#F0F0F5",
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
                          color: "#a0a0b0",
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
                          color: "#00FFFF",
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
          <Hr style={{ borderColor: "#1a1a2e", margin: "20px 0" }} />
          <Section style={{ textAlign: "center" as const, padding: "10px 0" }}>
            <Text
              style={{
                color: "#666680",
                fontSize: "12px",
                margin: "0 0 8px 0",
              }}
            >
              You&apos;re receiving this because you subscribed to AI Digest.
            </Text>
            <Link
              href={unsubscribeUrl}
              style={{
                color: "#FF0066",
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
