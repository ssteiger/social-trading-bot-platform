"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowDownRight,
	ArrowUpRight,
	BarChartHorizontal,
	DollarSign,
} from "lucide-react";
import { MarketOverview } from "./components/market-overview";
import { PriceChart } from "./components/price-chart";
import { RecentTrades } from "./components/recent-trades";

export default function DashboardPage() {
	const { data: marketData, isLoading: isLoadingMarket } = useQuery({
		queryKey: ["market-overview"],
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase
				.from("current_market_prices")
				.select("*")
				.limit(10);

			if (error) throw error;
			return data;
		},
	});

	const { data: recentTrades, isLoading: isLoadingTrades } = useQuery({
		queryKey: ["recent-trades"],
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase
				.from("trades")
				.select(`
          *,
          companies:company_id(company_name, ticker_symbol),
          exchanges:exchange_id(exchange_name, exchange_code)
        `)
				.order("executed_at", { ascending: false })
				.limit(10);

			if (error) throw error;
			return data;
		},
	});

	return (
		<div className="flex-1 space-y-4 p-8 pt-6">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="text-3xl font-bold tracking-tight">Trading Dashboard</h2>
				<div className="flex items-center space-x-2">
					<Button>Refresh Data</Button>
				</div>
			</div>

			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="analytics">Analytics</TabsTrigger>
					<TabsTrigger value="reports">Reports</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Market Volume
								</CardTitle>
								<DollarSign className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{isLoadingMarket ? (
										<Skeleton className="h-8 w-28" />
									) : (
										"$12,534,000"
									)}
								</div>
								<p className="text-xs text-muted-foreground">
									+20.1% from last week
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Active Companies
								</CardTitle>
								<BarChartHorizontal className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{isLoadingMarket ? <Skeleton className="h-8 w-20" /> : "573"}
								</div>
								<p className="text-xs text-muted-foreground">+18 new today</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Index Performance
								</CardTitle>
								<ArrowUpRight className="h-4 w-4 text-green-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{isLoadingMarket ? (
										<Skeleton className="h-8 w-24" />
									) : (
										"+2.5%"
									)}
								</div>
								<p className="text-xs text-muted-foreground">
									Across all exchanges
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Active Bots
								</CardTitle>
								<ArrowUpRight className="h-4 w-4 text-green-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{isLoadingMarket ? <Skeleton className="h-8 w-20" /> : "321"}
								</div>
								<p className="text-xs text-muted-foreground">
									+24 in the last hour
								</p>
							</CardContent>
						</Card>
					</div>

					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
						<Card className="col-span-4">
							<CardHeader>
								<CardTitle>Market Overview</CardTitle>
							</CardHeader>
							<CardContent className="pl-2">
								{isLoadingMarket ? (
									<Skeleton className="h-[300px] w-full" />
								) : (
									<PriceChart />
								)}
							</CardContent>
						</Card>

						<Card className="col-span-3">
							<CardHeader>
								<CardTitle>Recent Trades</CardTitle>
								<CardDescription>
									The latest transactions across all exchanges
								</CardDescription>
							</CardHeader>
							<CardContent>
								{isLoadingTrades ? (
									<div className="space-y-2">
										{Array(5)
											.fill(0)
											.map((_, i) => (
												<Skeleton key={i} className="h-14 w-full" />
											))}
									</div>
								) : (
									<RecentTrades trades={recentTrades || []} />
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
