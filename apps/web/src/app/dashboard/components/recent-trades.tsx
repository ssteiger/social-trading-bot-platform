"use client";

import { formatDistanceToNow } from "date-fns";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Trade {
	trade_id: number;
	price: number;
	quantity: number;
	executed_at: string;
	companies: {
		company_name: string;
		ticker_symbol: string;
	};
	exchanges: {
		exchange_name: string;
		exchange_code: string;
	};
}

export function RecentTrades({ trades }: { trades: Trade[] }) {
	return (
		<div className="space-y-4">
			{trades.map((trade) => (
				<div
					key={trade.trade_id}
					className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
				>
					<div className="flex items-center space-x-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
							{Math.random() > 0.5 ? (
								<ArrowUpRight className="h-5 w-5 text-green-500" />
							) : (
								<ArrowDownRight className="h-5 w-5 text-red-500" />
							)}
						</div>
						<div>
							<div className="font-medium">{trade.companies.ticker_symbol}</div>
							<div className="text-xs text-muted-foreground">
								{trade.exchanges.exchange_code}
							</div>
						</div>
					</div>
					<div className="text-right">
						<div className="font-medium">${trade.price.toFixed(2)}</div>
						<div className="text-xs text-muted-foreground">
							{formatDistanceToNow(new Date(trade.executed_at), {
								addSuffix: true,
							})}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
