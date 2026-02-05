import { CssBaseline, ThemeProvider } from "@mui/material";
import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";
import theme from "./theme";

const geistSans = Roboto({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Roboto_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Rampant Rage",
    description: "Rampant Rages AMAZING Website",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-[#121212]`}
            >
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
