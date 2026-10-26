import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, IBM_Plex_Mono, IBM_Plex_Sans, Kalam, Young_Serif } from "next/font/google";
import { DevConsoleNote } from "@/components/layout/DevConsoleNote";
import { ChatRoot } from "@/components/chat/ChatRoot";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Providers } from "@/components/providers";
import { chatUiCopy, journey, profile, projects, siteCopy, siteUrl } from "@/content";
import { personJsonLd } from "@/lib/seo";
import "./globals.css";

// The newest release in the career changelog, shown next to the name in the header.
const currentVersion = journey.map((j) => j.version).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];

const heading = Young_Serif({ weight: "400", subsets: ["latin"], variable: "--font-heading", display: "swap" });
const body = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const code = IBM_Plex_Mono({ weight: ["400", "600"], subsets: ["latin"], variable: "--font-code", display: "swap" });
// The handwriting I don't have.
const hand = Kalam({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-handwriting", display: "swap" });
// Only used for one line of Bangla, so it's not preloaded.
const bengali = Hind_Siliguri({ weight: "500", subsets: ["bengali"], variable: "--font-bengali", display: "swap", preload: false });

const description = siteCopy.seo.description;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${profile.name} · ${profile.title} | ${profile.specialties}`, template: `%s · ${profile.name}` },
  description,
  applicationName: profile.name,
  authors: [{ name: profile.name, url: siteUrl }],
  keywords: siteCopy.seo.keywords,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: profile.name,
    title: `${profile.name} · ${profile.title} | ${profile.specialties}`,
    description,
    url: "/",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: `${profile.name} · ${profile.title}`, description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f0e4" },
    { media: "(prefers-color-scheme: dark)", color: "#0f2c52" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${heading.variable} ${body.variable} ${code.variable} ${hand.variable} ${bengali.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }} />
        <Providers>
          <a
            href="#main"
            className="sr-only z-50 rounded-sm bg-primary px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 dark:text-bg"
          >
            Skip to content
          </a>
          <Header name={profile.name} version={currentVersion} nav={siteCopy.nav} copy={siteCopy.header} themeCopy={siteCopy.theme} />
          <main id="main" className="flex-1 overflow-x-clip">
            {children}
          </main>
          <Footer />
          <ChatRoot copy={chatUiCopy} projects={projects.map((p) => ({ slug: p.slug, title: p.title }))} />
          <DevConsoleNote email={profile.email} title={siteCopy.console.title} body={siteCopy.console.body} />
        </Providers>
      </body>
    </html>
  );
}
