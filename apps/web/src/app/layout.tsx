import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/layouts/main";
import QueryClientProvider from "@/components/providers/query-client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Toaster } from "sonner";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Social Trading Bots",
	description: "Social Trading Bots",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head />
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Toaster position="top-right" />
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<QueryClientProvider>
						<MainLayout>
							{/* Local DB Button */}
							<Button
								asChild
								variant="outline"
								size="sm"
								className="fixed top-2 left-2 z-50"
							>
								<Link
									href="http://127.0.0.1:54323/project/default"
									target="_blank"
									rel="noopener noreferrer"
								>
									local db
								</Link>
							</Button>
							{children}
						</MainLayout>
					</QueryClientProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
