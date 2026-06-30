import "./globals.css";

export const metadata = {
  title: "JARVIS AI",
  description: "Georgian AI Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ka">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
