import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

/**
 * الخط الرسمي: IBM Plex Sans Arabic (design.md §3).
 * الأوزان 400/500/600/700 كما نص التصميم.
 */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "وجهة أشوس — رفيق طالب التوجيهي",
  description:
    "منصة عربية لطالب التوجيهي الفلسطيني: جدولة، مهام يومية، بومودورو، بنك أسئلة، وخريطة تقدّم — الطالب صاحب القرار دائماً.",
  manifest: "/manifest.webmanifest",
  applicationName: "وجهة أشوس",
  icons: {
    icon: "/brand/icon-192.png",
    apple: "/brand/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "وجهة أشوس",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#150B0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // RTL دائماً. الوضع الافتراضي داكن؛ سكربت ما-قبل-الرسم يضيف صنف `light`
    // لو اختار الطالب الوضع الفاتح — قبل أول رسم لتفادي أي وميض.
    <html lang="ar" dir="rtl" className={plexArabic.variable}>
      <head>
        <script
          // يقرأ الاختيار المحفوظ ويطبّقه فوراً (متزامن، قبل الإماهة)
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("theme")==="light"){document.documentElement.classList.add("light")}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg-base text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
