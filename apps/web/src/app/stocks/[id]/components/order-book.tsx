"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface OrderBookItem {
	order_id: number;
	company_id: number;
	order_type: "buy" | "sell";
	price: number;
	quantity: number;
	bot_id: number;
	created_at: string;
}

export function OrderBook({ data }: { data: OrderBookItem[] }) {
	// Separate buy and sell orders
	const buyOrders = data
		.filter((order) => order.order_type === "buy")
		.sort((a, b) => b.price - a.price); // Sort descending for buy orders

	const sellOrders = data
		.filter((order) => order.order_type === "sell")
		.sort((a, b) => a.price - b.price); // Sort ascending for sell orders

	// Aggregate orders by price
	const aggregatedBuyOrders = buyOrders.reduce(
		(acc, order) => {
			const existingOrder = acc.find((o) => o.price === order.price);
			if (existingOrder) {
				existingOrder.quantity += order.quantity;
				existingOrder.orders += 1;
			} else {
				acc.push({
					price: order.price,
					quantity: order.quantity,
					orders: 1,
				});
			}
			return acc;
		},
		[] as { price: number; quantity: number; orders: number }[],
	);

	const aggregatedSellOrders = sellOrders.reduce(
		(acc, order) => {
			const existingOrder = acc.find((o) => o.price === order.price);
			if (existingOrder) {
				existingOrder.quantity += order.quantity;
				existingOrder.orders += 1;
			} else {
				acc.push({
					price: order.price,
					quantity: order.quantity,
					orders: 1,
				});
			}
			return acc;
		},
		[] as { price: number; quantity: number; orders: number }[],
	);

	// Calculate the spread
	const lowestSell = aggregatedSellOrders[0]?.price || 0;
	const highestBuy = aggregatedBuyOrders[0]?.price || 0;
	const spread = lowestSell - highestBuy;
	const spreadPercentage = highestBuy > 0 ? (spread / highestBuy) * 100 : 0;

	// For empty data, create some sample data
	const sampleBuyOrders =
		aggregatedBuyOrders.length > 0
			? aggregatedBuyOrders
			: Array(5)
					.fill(0)
					.map((_, i) => {
						const basePrice = 95 - i * 0.5;
						return {
							price: basePrice,
							quantity: Math.floor(1000 + Math.random() * 9000),
							orders: Math.floor(1 + Math.random() * 10),
						};
					});

	const sampleSellOrders =
		aggregatedSellOrders.length > 0
			? aggregatedSellOrders
			: Array(5)
					.fill(0)
					.map((_, i) => {
						const basePrice = 100 + i * 0.5;
						return {
							price: basePrice,
							quantity: Math.floor(1000 + Math.random() * 9000),
							orders: Math.floor(1 + Math.random() * 10),
						};
					});

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Card className="border-green-500/20">
				<CardHeader className="pb-2">
					<CardTitle className="text-green-500 flex items-center text-lg">
						<ArrowUpRight className="mr-2 h-4 w-4" />
						Buy Orders
					</CardTitle>
					<CardDescription>Orders to buy shares</CardDescription>
				</CardHeader>
				<CardContent>
					<table className="w-full">
						<thead>
							<tr className="text-muted-foreground text-xs">
								<th className="font-normal text-left pb-2">Price</th>
								<th className="font-normal text-right pb-2">Quantity</th>
								<th className="font-normal text-right pb-2">Orders</th>
							</tr>
						</thead>
						<tbody>
							{sampleBuyOrders.slice(0, 10).map((order, index) => (
								<tr key={index} className="border-t border-border h-9">
									<td className="text-green-500">${order.price.toFixed(2)}</td>
									<td className="text-right">
										{order.quantity.toLocaleString()}
									</td>
									<td className="text-right">{order.orders}</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>

			<Card className="border-red-500/20">
				<CardHeader className="pb-2">
					<CardTitle className="text-red-500 flex items-center text-lg">
						<ArrowDownRight className="mr-2 h-4 w-4" />
						Sell Orders
					</CardTitle>
					<CardDescription>Orders to sell shares</CardDescription>
				</CardHeader>
				<CardContent>
					<table className="w-full">
						<thead>
							<tr className="text-muted-foreground text-xs">
								<th className="font-normal text-left pb-2">Price</th>
								<th className="font-normal text-right pb-2">Quantity</th>
								<th className="font-normal text-right pb-2">Orders</th>
							</tr>
						</thead>
						<tbody>
							{sampleSellOrders.slice(0, 10).map((order, index) => (
								<tr key={index} className="border-t border-border h-9">
									<td className="text-red-500">${order.price.toFixed(2)}</td>
									<td className="text-right">
										{order.quantity.toLocaleString()}
									</td>
									<td className="text-right">{order.orders}</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>

			<div className="md:col-span-2 flex justify-center items-center bg-card text-card-foreground rounded-md p-4 border">
				<div className="text-center">
					<div className="text-muted-foreground text-sm mb-1">Spread</div>
					<div className="text-xl font-bold">
						${spread.toFixed(2)} ({spreadPercentage.toFixed(2)}%)
					</div>
				</div>
			</div>
		</div>
	);
}
