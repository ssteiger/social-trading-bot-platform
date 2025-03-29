import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/layouts/main";
import QueryClientProvider from "@/components/providers/query-client-provider";
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
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Toaster position="top-right" />
				<QueryClientProvider>
					<MainLayout>
						{/* Local DB Button */}
						<Link
							href="http://127.0.0.1:54323/project/default"
							target="_blank"
							rel="noopener noreferrer"
							className="fixed bottom-2 right-2 z-50 bg-fuchsia-400 hover:bg-fuchsia-400/80 text-white text-xs px-2 py-1 rounded shadow-md transition-colors"
						>
							local db
						</Link>
						{children}
					</MainLayout>
				</QueryClientProvider>
			</body>
		</html>
	);
}
