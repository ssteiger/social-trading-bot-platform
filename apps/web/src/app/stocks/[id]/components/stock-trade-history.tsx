"use client";

import { formatDistanceToNow } from "date-fns";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Trade {
	trade_id: number;
	company_id: number;
	price: number;
	quantity: number;
	executed_at: string;
	buyer_bot_id: number;
	seller_bot_id: number;
	buyers: {
		bot_name: string;
	};
	sellers: {
		bot_name: string;
	};
}

export function StockTradeHistory({ trades }: { trades: Trade[] }) {
	return (
		<div className="space-y-1">
			<div className="grid grid-cols-5 text-xs text-muted-foreground py-2 px-4">
				<div>Time</div>
				<div>Price</div>
				<div>Quantity</div>
				<div>Buyer</div>
				<div>Seller</div>
			</div>

			{trades.length === 0 ? (
				<div className="text-center py-8 text-muted-foreground">
					No trade history available
				</div>
			) : (
				trades.map((trade) => {
					const isUp = Math.random() > 0.5; // In a real app, you'd compare with previous trade
					return (
						<div
							key={trade.trade_id}
							className="grid grid-cols-5 py-3 px-4 hover:bg-accent/50 rounded-md transition-colors"
						>
							<div className="text-sm text-muted-foreground">
								{formatDistanceToNow(new Date(trade.executed_at), {
									addSuffix: true,
								})}
							</div>
							<div className="flex items-center">
								{isUp ? (
									<ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
								) : (
									<ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
								)}
								<span className={isUp ? "text-green-500" : "text-red-500"}>
									${trade.price.toFixed(2)}
								</span>
							</div>
							<div>{trade.quantity.toLocaleString()}</div>
							<div className="truncate">{trade.buyers.bot_name}</div>
							<div className="truncate">{trade.sellers.bot_name}</div>
						</div>
					);
				})
			)}
		</div>
	);
}
