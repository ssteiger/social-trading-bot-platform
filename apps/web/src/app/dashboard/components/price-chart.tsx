"use client";

import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export function PriceChart() {
	const { data, isLoading } = useQuery({
		queryKey: ["price-history"],
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase
				.from("price_history")
				.select("*")
				.order("timestamp", { ascending: true })
				.limit(100);

			if (error) throw error;

			// Format the data for the chart
			return data.map((item) => ({
				time: format(new Date(item.timestamp), "HH:mm"),
				price: item.close_price,
				volume: item.volume,
			}));
		},
	});

	// Sample data for initial development
	const sampleData = Array(24)
		.fill(0)
		.map((_, i) => {
			const hour = i.toString().padStart(2, "0");
			const basePrice = 100 + Math.sin(i / 3) * 20;
			return {
				time: `${hour}:00`,
				price: basePrice + Math.random() * 5,
				volume: Math.floor(500 + Math.random() * 1000),
			};
		});

	const chartData = data || sampleData;

	return (
		<ResponsiveContainer width="100%" height={300}>
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
					dataKey="price"
					stroke="var(--color-primary)"
					fillOpacity={1}
					fill="url(#colorPrice)"
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
}
