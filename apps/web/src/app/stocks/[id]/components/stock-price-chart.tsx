"use client";

import { format, parseISO } from "date-fns";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface PriceHistoryItem {
	timestamp: string;
	open_price: number;
	close_price: number;
	high_price: number;
	low_price: number;
	volume: number;
}

interface FormattedPriceData {
	date: string;
	time: string;
	open: number;
	close: number;
	high: number;
	low: number;
	volume: number;
}

export function StockPriceChart({ data }: { data: PriceHistoryItem[] }) {
	// Format the data for the chart
	const formattedData: FormattedPriceData[] = data.map((item) => {
		const date = parseISO(item.timestamp);
		return {
			date: format(date, "MMM dd"),
			time: format(date, "HH:mm"),
			open: item.open_price,
			close: item.close_price,
			high: item.high_price,
			low: item.low_price,
			volume: item.volume,
		};
	});

	// Use sample data if no data available
	const chartData =
		formattedData.length > 0
			? formattedData
			: Array(24)
					.fill(0)
					.map((_, i) => {
						const basePrice = 100 + Math.sin(i / 3) * 20;
						return {
							date: `Day ${Math.floor(i / 6) + 1}`,
							time: `${i % 24}:00`,
							open: basePrice - Math.random() * 2,
							close: basePrice + Math.random() * 2,
							high: basePrice + 2 + Math.random() * 3,
							low: basePrice - 2 - Math.random() * 3,
							volume: Math.floor(1000 + Math.random() * 9000),
						};
					});

	return (
		<div className="space-y-6">
			<div className="h-[300px]">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart
						data={chartData}
						margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
					>
						<defs>
							<linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-primary)"
									stopOpacity={0.8}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-primary)"
									stopOpacity={0}
								/>
							</linearGradient>
						</defs>
						<XAxis
							dataKey="time"
							tickLine={false}
							axisLine={false}
							tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
							domain={["auto", "auto"]}
						/>
						<CartesianGrid
							strokeDasharray="3 3"
							vertical={false}
							stroke="var(--color-border)"
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: "var(--color-card)",
								borderColor: "var(--color-border)",
								color: "var(--color-foreground)",
								borderRadius: "var(--radius-md)",
								boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
							}}
							itemStyle={{
								color: "var(--color-foreground)",
							}}
							labelStyle={{
								color: "var(--color-muted-foreground)",
								fontWeight: "bold",
								marginBottom: "5px",
							}}
						/>
						<Area
							type="monotone"
							dataKey="close"
							stroke="var(--color-primary)"
							fillOpacity={1}
							fill="url(#colorPrice)"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>

			<div className="h-[100px]">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={chartData}
						margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
					>
						<XAxis
							dataKey="time"
							tickLine={false}
							axisLine={false}
							tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: "var(--color-card)",
								borderColor: "var(--color-border)",
								color: "var(--color-foreground)",
								borderRadius: "var(--radius-md)",
							}}
						/>
						<Bar
							dataKey="volume"
							fill="var(--color-accent)"
							radius={[2, 2, 0, 0]}
							barSize={20}
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
