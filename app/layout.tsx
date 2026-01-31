import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";
import theme from "./theme";
import { ThemeProvider } from "@mui/material";

const geistSans = Roboto({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Roboto_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Rampant Rage logs viewer",
    description: "View the errors lol",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <ThemeProvider theme={theme}>{children}</ThemeProvider>
            </body>
        </html>
    );
}
