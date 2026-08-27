import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata = {
  title: "بوتیک مدرن | پرو آنلاین با هوش مصنوعی",
  description: "سامانه پرو مجازی و خرید آنلاین پوشاک",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body
        className={`${vazir.className} bg-zinc-950 text-zinc-100 antialiased min-h-screen font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
