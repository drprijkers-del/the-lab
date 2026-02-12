import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { LanguageProvider } from "@/lib/i18n/context";
import { ThemeProvider } from "@/lib/theme/context";
import { CookieBanner } from "@/components/legal/cookie-banner";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Pulse Labs",
  description: "Tools for teams that build - Vibe, Way of Work & more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#e11d48',
          colorBackground: '#1c1917',
          colorInputBackground: '#292524',
          colorInputText: '#f5f5f4',
          colorText: '#f5f5f4',
          colorTextSecondary: '#a8a29e',
          colorNeutral: '#a8a29e',
          borderRadius: '0.75rem',
          fontFamily: 'var(--font-geist), system-ui, sans-serif',
        },
        elements: {
          card: 'shadow-xl border border-stone-700/50',
          formButtonPrimary: 'bg-rose-600 hover:bg-rose-500',
          footerActionLink: 'text-rose-400 hover:text-rose-300',
        },
      }}
      localization={{
        signIn: {
          start: {
            title: 'Log in',
            subtitle: 'Welkom terug bij Pulse Labs',
          },
        },
        signUp: {
          start: {
            title: 'Account aanmaken',
            subtitle: 'Maak een account om aan de slag te gaan',
          },
        },
      }}
    >
      <html lang="nl" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var theme = localStorage.getItem('theme');
                    if (theme === 'dark' || (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                      document.documentElement.classList.add('dark');
                    }
                  } catch (e) {}
                })();
              `,
            }}
          />
        </head>
        <body className={`${geist.variable} font-sans antialiased bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 transition-colors`} suppressHydrationWarning>
          <ThemeProvider>
            <LanguageProvider>
              {children}
              <CookieBanner />
            </LanguageProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
