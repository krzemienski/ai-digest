import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Preview,
} from "@react-email/components";
import * as React from "react";

export interface WelcomeEmailProps {
  unsubscribeUrl: string;
}

export function WelcomeEmail({ unsubscribeUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to AI Digest</Preview>
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
            padding: "40px 20px",
          }}
        >
          <Section style={{ textAlign: "center" as const }}>
            <Text
              style={{
                color: "#00FFFF",
                fontSize: "32px",
                fontWeight: "bold",
                margin: "0 0 8px 0",
                letterSpacing: "2px",
              }}
            >
              AI DIGEST
            </Text>
            <Text
              style={{
                color: "#00FF88",
                fontSize: "14px",
                margin: "0 0 32px 0",
                textTransform: "uppercase" as const,
                letterSpacing: "1px",
              }}
            >
              Welcome, Operator
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: "#12121f",
              borderLeft: "3px solid #00FFFF",
              padding: "20px 24px",
              marginBottom: "24px",
              borderRadius: "0 4px 4px 0",
            }}
          >
            <Text
              style={{
                color: "#F0F0F5",
                fontSize: "15px",
                lineHeight: "1.7",
                margin: "0 0 16px 0",
              }}
            >
              You&apos;re now plugged into the AI Digest network. Here&apos;s what to
              expect:
            </Text>
            <Text
              style={{
                color: "#a0a0b0",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0 0 8px 0",
              }}
            >
              <span style={{ color: "#00FFFF" }}>&#9656;</span> Daily curated AI
              news from 7+ sources
            </Text>
            <Text
              style={{
                color: "#a0a0b0",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0 0 8px 0",
              }}
            >
              <span style={{ color: "#00FFFF" }}>&#9656;</span> AI-generated
              editorial synthesis
            </Text>
            <Text
              style={{
                color: "#a0a0b0",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0 0 8px 0",
              }}
            >
              <span style={{ color: "#00FFFF" }}>&#9656;</span> Multi-speaker
              podcast episodes
            </Text>
            <Text
              style={{
                color: "#a0a0b0",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              <span style={{ color: "#00FFFF" }}>&#9656;</span> Delivered straight
              to your inbox
            </Text>
          </Section>

          <Section style={{ textAlign: "center" as const, marginTop: "16px" }}>
            <Text
              style={{
                color: "#F0F0F5",
                fontSize: "14px",
                margin: "0 0 4px 0",
              }}
            >
              Your first digest arrives with the next pipeline run.
            </Text>
            <Text
              style={{
                color: "#666680",
                fontSize: "12px",
                margin: 0,
              }}
            >
              Sit tight.
            </Text>
          </Section>

          <Hr
            style={{ borderColor: "#1a1a2e", margin: "32px 0 16px 0" }}
          />
          <Section style={{ textAlign: "center" as const }}>
            <Text
              style={{
                color: "#666680",
                fontSize: "12px",
                margin: "0 0 8px 0",
              }}
            >
              Changed your mind?
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

export default WelcomeEmail;
