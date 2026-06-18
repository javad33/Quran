import type { Metadata } from "next";
import { Amiri, Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "نور | قرآن کریم و مفاتیح الجنان",
  description:
    "وب اپلیکیشن جامع قرآن کریم و مفاتیح الجنان — تلاوت، ترجمه، اوقات شرعی، قبله، تسبیح و ادعیه با طراحی مدرن و راست‌چین.",
  keywords: [
    "قرآن",
    "مفاتیح الجنان",
    "قرآن کریم",
    "ادعیه",
    "اوقات شرعی",
    "قبله",
    "تسبیح",
    "Quran",
    "Mafatih",
  ],
  authors: [{ name: "Noor App" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} ${amiri.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
