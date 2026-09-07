import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Línea de Tiempo de Proyectos | Patprimo & Pash",
  description: "Plataforma de seguimiento en tiempo real de avance de proyectos por fases para Patprimo y Pash",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased light">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
