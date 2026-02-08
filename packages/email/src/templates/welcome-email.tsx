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
            padding: "40px 20px",
          }}
        >
          <Section style={{ textAlign: "center" as const }}>
            <Text
              style={{
                color: "#FAFAFA",
                fontSize: "32px",
                fontWeight: "bold",
                margin: "0 0 8px 0",
                letterSpacing: "1px",
              }}
            >
              AI Digest
            </Text>
            <Text
              style={{
                color: "#3b82f6",
                fontSize: "14px",
                margin: "0 0 32px 0",
                textTransform: "uppercase" as const,
                letterSpacing: "1px",
              }}
            >
              Welcome
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: "#18181B",
              borderLeft: "3px solid #3b82f6",
              padding: "20px 24px",
              marginBottom: "24px",
              borderRadius: "0 4px 4px 0",
            }}
          >
            <Text
              style={{
                color: "#FAFAFA",
                fontSize: "15px",
                lineHeight: "1.7",
                margin: "0 0 16px 0",
              }}
            >
              You&apos;re now subscribed to AI Digest. Here&apos;s what to
              expect:
            </Text>
            <Text
              style={{
                color: "#A1A1AA",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0 0 8px 0",
              }}
            >
              <span style={{ color: "#3b82f6" }}>&#9656;</span> Daily curated AI
              news from 7+ sources
            </Text>
            <Text
              style={{
                color: "#A1A1AA",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0 0 8px 0",
              }}
            >
              <span style={{ color: "#3b82f6" }}>&#9656;</span> AI-generated
              editorial synthesis
            </Text>
            <Text
              style={{
                color: "#A1A1AA",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0 0 8px 0",
              }}
            >
              <span style={{ color: "#3b82f6" }}>&#9656;</span> Multi-speaker
              podcast episodes
            </Text>
            <Text
              style={{
                color: "#A1A1AA",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              <span style={{ color: "#3b82f6" }}>&#9656;</span> Delivered straight
              to your inbox
            </Text>
          </Section>

          <Section style={{ textAlign: "center" as const, marginTop: "16px" }}>
            <Text
              style={{
                color: "#FAFAFA",
                fontSize: "14px",
                margin: "0 0 4px 0",
              }}
            >
              Your first digest arrives with the next pipeline run.
            </Text>
            <Text
              style={{
                color: "#71717A",
                fontSize: "12px",
                margin: 0,
              }}
            >
              Sit tight.
            </Text>
          </Section>

          <Hr
            style={{ borderColor: "#3F3F46", margin: "32px 0 16px 0" }}
          />
          <Section style={{ textAlign: "center" as const }}>
            <Text
              style={{
                color: "#71717A",
                fontSize: "12px",
                margin: "0 0 8px 0",
              }}
            >
              Changed your mind?
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

export default WelcomeEmail;
