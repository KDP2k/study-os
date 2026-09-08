import "./globals.css";
import { StudyProvider } from "@/components/StudyProvider";

export const metadata = {
  title: "Study OS // Engineering Console",
  description: "A personal academic operating system for Lakehead Software Engineering."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <StudyProvider>{children}</StudyProvider>
      </body>
    </html>
  );
}
