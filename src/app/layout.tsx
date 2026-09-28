import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaumyaLabs JobTrack — Your job hunt, finally quiet.",
  description: "Track every job application in one beautiful place. Paste an email, AI does the rest.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
