
import "./globals.css";

export const metadata = {
  title: "GoViral Agent — Creator Studio",
  description:
    "Research, plan, create, refine and publish content across platforms.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#192a23",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
