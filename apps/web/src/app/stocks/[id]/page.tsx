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
	ArrowLeft,
	BarChart3,
	Clock,
	DollarSign,
	TrendingUp,
	Users,
} from "lucide-react";
import Link from "next/link";
import { OrderBook } from "./components/order-book";
import { StockPriceChart } from "./components/stock-price-chart";
import { StockTradeHistory } from "./components/stock-trade-history";

export default function StockDetailPage({
	params,
}: { params: { id: string } }) {
	const stockId = Number.parseInt(params.id);

	const { data: stockData, isLoading } = useQuery({
		queryKey: ["stock", stockId],
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase
				.from("companies")
				.select(`
          *,
          exchanges:exchange_id(exchange_name, exchange_code),
          creator:creator_bot_id(bot_name)
        `)
				.eq("company_id", stockId)
				.single();

			if (error) throw error;
			return data;
		},
	});

	const { data: priceHistory, isLoading: isLoadingPriceHistory } = useQuery({
		queryKey: ["price-history", stockId],
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase
				.from("price_history")
				.select("*")
				.eq("company_id", stockId)
				.order("timestamp", { ascending: true })
				.limit(200);

			if (error) throw error;
			return data;
		},
		enabled: !isLoading && !!stockData,
	});

	const { data: orderBookData, isLoading: isLoadingOrderBook } = useQuery({
		queryKey: ["order-book", stockId],
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase
				.from("order_book")
				.select("*")
				.eq("company_id", stockId);

			if (error) throw error;
			return data;
		},
		enabled: !isLoading && !!stockData,
	});

	const { data: tradeHistory, isLoading: isLoadingTrades } = useQuery({
		queryKey: ["trade-history", stockId],
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase
				.from("trades")
				.select(`
          *,
          buyers:buyer_bot_id(bot_name),
          sellers:seller_bot_id(bot_name)
        `)
				.eq("company_id", stockId)
				.order("executed_at", { ascending: false })
				.limit(30);

			if (error) throw error;
			return data;
		},
		enabled: !isLoading && !!stockData,
	});

	// Get current price from most recent trade
	const currentPrice =
		tradeHistory && tradeHistory.length > 0
			? tradeHistory[0].price_in_cents
			: null;

	return (
		<div className="flex-1 space-y-4 p-8 pt-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button variant="outline" size="icon" asChild>
						<Link href="/stocks">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>

					{isLoading ? (
						<Skeleton className="h-8 w-48" />
					) : (
						<h2 className="text-3xl font-bold tracking-tight">
							{stockData?.ticker_symbol} - {stockData?.company_name}
						</h2>
					)}
				</div>

				<div className="flex gap-2">
					<Button>Trade</Button>
					<Button variant="outline">Add to Watchlist</Button>
				</div>
			</div>

			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{Array(4)
						.fill(0)
						.map((_, i) => (
							<Skeleton key={i} className="h-32" />
						))}
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Current Price
							</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								${currentPrice.toFixed(2)}
							</div>
							<p className="text-xs text-muted-foreground">
								Initial price: ${stockData?.initial_price.toFixed(2)}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Exchange</CardTitle>
							<BarChart3 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{stockData?.exchanges.exchange_code}
							</div>
							<p className="text-xs text-muted-foreground">
								{stockData?.exchanges.exchange_name}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Total Shares
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{stockData?.total_shares.toLocaleString()}
							</div>
							<p className="text-xs text-muted-foreground">
								Created by {stockData?.creator.bot_name}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Market Cap</CardTitle>
							<TrendingUp className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								$
								{(currentPrice * stockData?.total_shares).toLocaleString(
									undefined,
									{
										maximumFractionDigits: 0,
									},
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								Based on current price
							</p>
						</CardContent>
					</Card>
				</div>
			)}

			<Tabs defaultValue="chart" className="space-y-4">
				<TabsList>
					<TabsTrigger value="chart">Price Chart</TabsTrigger>
					<TabsTrigger value="orderbook">Order Book</TabsTrigger>
					<TabsTrigger value="trades">Trade History</TabsTrigger>
					<TabsTrigger value="info">Info</TabsTrigger>
				</TabsList>

				<TabsContent value="chart" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Price History</CardTitle>
							<CardDescription>
								Historical price performance for {stockData?.ticker_symbol}
							</CardDescription>
						</CardHeader>
						<CardContent className="h-[400px]">
							{isLoadingPriceHistory ? (
								<Skeleton className="h-full w-full" />
							) : (
								<StockPriceChart data={priceHistory || []} />
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="orderbook">
					<Card>
						<CardHeader>
							<CardTitle>Order Book</CardTitle>
							<CardDescription>
								Current buy and sell orders for {stockData?.ticker_symbol}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoadingOrderBook ? (
								<Skeleton className="h-[400px] w-full" />
							) : (
								<OrderBook data={orderBookData || []} />
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="trades">
					<Card>
						<CardHeader>
							<CardTitle>Trade History</CardTitle>
							<CardDescription>
								Recent trades for {stockData?.ticker_symbol}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoadingTrades ? (
								<Skeleton className="h-[400px] w-full" />
							) : (
								<StockTradeHistory trades={tradeHistory || []} />
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="info">
					<Card>
						<CardHeader>
							<CardTitle>Company Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{isLoading ? (
								<Skeleton className="h-[200px] w-full" />
							) : (
								<>
									<div>
										<h3 className="font-semibold mb-2">Description</h3>
										<p>
											{stockData?.description || "No description available."}
										</p>
									</div>

									<div>
										<h3 className="font-semibold mb-2">Details</h3>
										<div className="grid grid-cols-2 gap-2">
											<div className="text-sm text-muted-foreground">
												Creator
											</div>
											<div>{stockData?.creator.bot_name}</div>

											<div className="text-sm text-muted-foreground">
												Created
											</div>
											<div>
												{new Date(
													stockData?.created_at || "",
												).toLocaleDateString()}
											</div>

											<div className="text-sm text-muted-foreground">
												Exchange
											</div>
											<div>
												{stockData?.exchanges.exchange_name} (
												{stockData?.exchanges.exchange_code})
											</div>

											<div className="text-sm text-muted-foreground">
												Initial Price
											</div>
											<div>${stockData?.initial_price.toFixed(2)}</div>

											<div className="text-sm text-muted-foreground">
												Total Shares
											</div>
											<div>{stockData?.total_shares.toLocaleString()}</div>
										</div>
									</div>
								</>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
