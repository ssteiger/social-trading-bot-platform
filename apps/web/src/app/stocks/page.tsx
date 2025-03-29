"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { StocksTable } from "./components/stocks-table";

export default function StocksPage() {
	const { data: companies, isLoading } = useQuery({
		queryKey: ["companies"],
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase
				.from("companies")
				.select(`
          *,
          exchanges:exchange_id(exchange_name, exchange_code),
          creator:creator_bot_id(bot_name)
        `)
				.order("created_at", { ascending: false });

			if (error) throw error;
			return data;
		},
	});

	return (
		<div className="flex-1 space-y-4 p-8 pt-6">
			<div className="flex items-center justify-between">
				<h2 className="text-3xl font-bold tracking-tight">Stocks</h2>
				<Button>Create Stock</Button>
			</div>

			<div className="flex items-center max-w-sm space-x-2">
				<div className="relative flex-1">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search stocks..."
						className="pl-8"
					/>
				</div>
				<Button variant="outline">Filters</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Stocks</CardTitle>
					<CardDescription>
						Browse all publicly traded companies across all exchanges
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<Skeleton className="h-[400px] w-full" />
					) : (
						<StocksTable data={companies || []} />
					)}
				</CardContent>
			</Card>
		</div>
	);
}
