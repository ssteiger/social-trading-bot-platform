"use client";

import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface MarketData {
	company_id: number;
	ticker_symbol: string;
	company_name: string;
	current_price: number;
	price_change: number;
	percent_change: number;
	volume: number;
}

export function MarketOverview() {
	const { data, isLoading } = useQuery({
		queryKey: ["market-overview"],
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase
				.from("current_market_prices")
				.select("*")
				.limit(10);

			if (error) throw error;

			// Sample data for development
			const sampleData: MarketData[] = Array(10)
				.fill(0)
				.map((_, i) => {
					const priceChange =
						Math.random() > 0.5 ? Math.random() * 5 : -Math.random() * 5;
					const currentPrice = 50 + Math.random() * 150;

					return {
						company_id: i + 1,
						ticker_symbol: `TICK${i + 1}`,
						company_name: `Company ${i + 1}`,
						current_price: currentPrice,
						price_change: priceChange,
						percent_change: (priceChange / (currentPrice - priceChange)) * 100,
						volume: Math.floor(10000 + Math.random() * 990000),
					};
				});

			return data || sampleData;
		},
	});

	return (
		<div className="space-y-4">
			<div className="rounded-md border">
				<table className="w-full caption-bottom text-sm">
					<thead className="[&_tr]:border-b">
						<tr className="border-b transition-colors hover:bg-muted/50">
							<th className="h-12 px-4 text-left align-middle font-medium">
								Symbol
							</th>
							<th className="h-12 px-4 text-left align-middle font-medium">
								Name
							</th>
							<th className="h-12 px-4 text-right align-middle font-medium">
								Price
							</th>
							<th className="h-12 px-4 text-right align-middle font-medium">
								Change
							</th>
							<th className="h-12 px-4 text-right align-middle font-medium">
								Volume
							</th>
						</tr>
					</thead>
					<tbody className="[&_tr:last-child]:border-0">
						{(data || []).map((stock) => (
							<tr
								key={stock.company_id}
								className="border-b transition-colors hover:bg-muted/50"
							>
								<td className="p-4 align-middle font-medium">
									<Link
										href={`/stocks/${stock.company_id}`}
										className="font-medium hover:underline"
									>
										{stock.ticker_symbol}
									</Link>
								</td>
								<td className="p-4 align-middle">{stock.company_name}</td>
								<td className="p-4 align-middle text-right">
									${stock.current_price.toFixed(2)}
								</td>
								<td className="p-4 align-middle text-right">
									<div className="flex items-center justify-end gap-1">
										{stock.price_change > 0 ? (
											<ArrowUpRight className="h-4 w-4 text-green-500" />
										) : (
											<ArrowDownRight className="h-4 w-4 text-red-500" />
										)}
										<span
											className={
												stock.price_change > 0
													? "text-green-500"
													: "text-red-500"
											}
										>
											{stock.price_change.toFixed(2)} (
											{stock.percent_change.toFixed(2)}%)
										</span>
									</div>
								</td>
								<td className="p-4 align-middle text-right">
									{stock.volume.toLocaleString()}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
