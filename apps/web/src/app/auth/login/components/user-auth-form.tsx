"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Github, LoaderCircle } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

type UserAuthFormProps = React.HTMLAttributes<HTMLDivElement>;

export function UserAuthFormLogin({ className, ...props }: UserAuthFormProps) {
	const [email, setEmail] = React.useState<string>("");
	const [isEmailSent, setIsEmailSent] = React.useState<boolean>(false);
	const supabase = createClient();

	// Email magic link login mutation
	const loginMutation = useMutation({
		mutationFn: async (email: string) => {
			const { data, error } = await supabase.auth.signInWithOtp({
				email,
				options: {
					emailRedirectTo: `${window.location.origin}/auth/verify`,
				},
			});

			if (error) {
				throw new Error(error.message);
			}

			return data;
		},
		onSuccess: () => {
			setIsEmailSent(true);
			toast.success("Login link sent to your email");
		},
		onError: (error) => {
			toast.error(`Login failed: ${error.message}`);
		},
	});

	// OAuth login mutation
	const oauthMutation = useMutation({
		mutationFn: async (provider: "github") => {
			const { error } = await supabase.auth.signInWithOAuth({
				provider,
				options: {
					redirectTo: `${window.location.origin}/auth/verify`,
				},
			});

			if (error) {
				throw new Error(error.message);
			}
		},
		onError: (error) => {
			toast.error(`GitHub login failed: ${error.message}`);
		},
	});

	// Determine if any mutation is loading
	const isLoading = loginMutation.isPending || oauthMutation.isPending;

	// Determine error message from either mutation
	const error =
		loginMutation.error?.message || oauthMutation.error?.message || null;

	async function onSubmit(event: React.SyntheticEvent) {
		event.preventDefault();
		loginMutation.mutate(email);
	}

	return (
		<div className={cn("grid gap-6", className)} {...props}>
			{error && (
				<div className="p-3 text-sm text-red-500 rounded-md bg-red-50">
					{error}
				</div>
			)}

			{isEmailSent && (
				<div className="p-3 text-sm text-green-600 rounded-md bg-green-50">
					Check your email for a login link.
				</div>
			)}

			<form onSubmit={onSubmit}>
				<div className="grid gap-2">
					{isEmailSent ? (
						<></>
					) : (
						<div className="grid gap-1">
							<Label className="sr-only" htmlFor="email">
								Email
							</Label>
							<Input
								id="email"
								placeholder="name@example.com"
								type="email"
								autoCapitalize="none"
								autoComplete="email"
								autoCorrect="off"
								disabled={isLoading}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
					)}
					{!isEmailSent && (
						<Button disabled={isLoading} type="submit">
							{loginMutation.isPending && (
								<LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
							)}
							Send Login Link
						</Button>
					)}
				</div>
			</form>

			{isEmailSent && (
				<Link href="http://localhost:54324/" target="_blank" rel="noreferrer">
					<Button size="sm" variant="outline" className="w-full">
						Open local email client <ArrowRight className="w-4 h-4 ml-2" />
					</Button>
				</Link>
			)}

			{!isEmailSent && (
				<>
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="px-2 bg-background text-muted-foreground">
								Or continue with
							</span>
						</div>
					</div>
					<Button
						variant="outline"
						type="button"
						disabled={isLoading}
						onClick={() => oauthMutation.mutate("github")}
					>
						{oauthMutation.isPending ? (
							<LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
						) : (
							<Github className="w-4 h-4 mr-2" />
						)}{" "}
						GitHub
					</Button>
				</>
			)}
		</div>
	);
}
