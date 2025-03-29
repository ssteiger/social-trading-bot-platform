"use client";

import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";

interface MainLayoutProps {
	children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
	const pathname = usePathname();
	const router = useRouter();
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const supabase = createClient();

	// Check if user is logged in using Supabase
	useEffect(() => {
		const checkUser = async () => {
			const { data } = await supabase.auth.getSession();
			if (data.session) {
				setIsLoggedIn(true);
			} else {
				setIsLoggedIn(false);
			}
		};

		checkUser();

		// Set up auth state change listener
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			setIsLoggedIn(!!session);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [supabase]);

	const handleLogout = async () => {
		// Sign out using Supabase
		const { error } = await supabase.auth.signOut();
		if (!error) {
			router.push("/");
		}
	};

	// Skip layout rendering for auth pages
	if (pathname?.startsWith("/auth")) {
		return <>{children}</>;
	}

	return (
		<div className="flex min-h-screen flex-col">
			<header className="sticky px-6 top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container flex h-16 items-center justify-between mx-auto max-w-6xl">
					<div className="flex items-center gap-6 md:gap-10">
						<Link href="/" className="font-bold text-xl flex items-center">
							{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="w-6 h-6 mr-2"
								title="Social Trading Bots Logo"
							>
								<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
							</svg>
							Social Trading Bots
						</Link>
						<NavigationMenu>
							<NavigationMenuList>
								<NavigationMenuItem>
									<Link href="/dashboard" legacyBehavior passHref>
										<NavigationMenuLink
											className={navigationMenuTriggerStyle()}
										>
											Dashboard
										</NavigationMenuLink>
									</Link>
								</NavigationMenuItem>
							</NavigationMenuList>
						</NavigationMenu>
					</div>
					<div className="flex items-center gap-4">
						{isLoggedIn ? (
							<Button variant="ghost" onClick={handleLogout}>
								Logout
							</Button>
						) : (
							<>
								<Link href="/auth/login">
									<Button variant="ghost">Login</Button>
								</Link>
								<Link href="/auth/register">
									<Button>Sign Up</Button>
								</Link>
							</>
						)}
					</div>
				</div>
			</header>

			<main className="flex-1">
				<div className="container py-8 mx-auto max-w-6xl">{children}</div>
			</main>

			<footer className="px-6 border-t bg-muted/40">
				<div className="container py-10 mx-auto max-w-6xl">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-4">
						<div>
							<h3 className="text-lg font-semibold">
								Social Trading Bot Platform
							</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								A trading bot platform.
							</p>
						</div>
						<div>
							<h3 className="text-lg font-semibold">Links</h3>
							<ul className="mt-2 space-y-2 text-sm">
								<li>
									<Link
										href="/link-1"
										className="text-muted-foreground hover:text-foreground"
									>
										Link 1
									</Link>
								</li>
								<li>
									<Link
										href="/link-2"
										className="text-muted-foreground hover:text-foreground"
									>
										Link 2
									</Link>
								</li>
								<li>
									<Link
										href="/link-3"
										className="text-muted-foreground hover:text-foreground"
									>
										Link 3
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="text-lg font-semibold">Company</h3>
							<ul className="mt-2 space-y-2 text-sm">
								<li>
									<Link
										href="/about"
										className="text-muted-foreground hover:text-foreground"
									>
										About Us
									</Link>
								</li>
								<li>
									<Link
										href="/careers"
										className="text-muted-foreground hover:text-foreground"
									>
										Careers
									</Link>
								</li>
								<li>
									<Link
										href="/contact"
										className="text-muted-foreground hover:text-foreground"
									>
										Contact Us
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h3 className="text-lg font-semibold">Legal</h3>
							<ul className="mt-2 space-y-2 text-sm">
								<li>
									<Link
										href="/privacy"
										className="text-muted-foreground hover:text-foreground"
									>
										Privacy Policy
									</Link>
								</li>
								<li>
									<Link
										href="/terms"
										className="text-muted-foreground hover:text-foreground"
									>
										Terms of Service
									</Link>
								</li>
							</ul>
						</div>
					</div>
					<Separator className="my-6" />
					<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
						<p className="text-sm text-muted-foreground">
							&copy; {new Date().getFullYear()} Social Trading Bot Platform. All
							rights reserved.
						</p>
						<div className="flex items-center gap-4">
							<Link
								href="https://twitter.com"
								className="text-muted-foreground hover:text-foreground"
							>
								Twitter
							</Link>
							<Link
								href="https://instagram.com"
								className="text-muted-foreground hover:text-foreground"
							>
								Instagram
							</Link>
							<Link
								href="https://facebook.com"
								className="text-muted-foreground hover:text-foreground"
							>
								Facebook
							</Link>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
