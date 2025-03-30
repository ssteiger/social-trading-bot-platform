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
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { PriceChart } from "./components/price-chart";

/*
CREATE TABLE IF NOT EXISTS "price_history" (
	"history_id" serial PRIMARY KEY NOT NULL,
	"company_id" varchar(10) NOT NULL,
	"exchange_id" varchar(10) NOT NULL,
	"open_price_in_cents" bigint NOT NULL,
	"close_price_in_cents" bigint NOT NULL,
	"high_price_in_cents" bigint NOT NULL,
	"low_price_in_cents" bigint NOT NULL,
	"volume" bigint NOT NULL,
	"timestamp" timestamp NOT NULL,
	"period_length" varchar(20) NOT NULL,
	CONSTRAINT "price_history_company_id_timestamp_period_length_key" UNIQUE("company_id","timestamp","period_length")
);
*/

export default function DashboardPage() {
	const {
		data: companyData,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ["dashboard", "company"],
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase.from("company").select("*");

			if (error) throw error;
			return data;
		},
	});

	return (
		<div className="flex-1 space-y-4 p-8 pt-6">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
				<div className="flex items-center space-x-2">
					<Button onClick={() => refetch()}>Refresh Data</Button>
				</div>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 gap-4">
					{[...Array(4)].map((_, i) => (
						<Card key={i}>
							<CardHeader>
								<Skeleton className="h-6 w-1/3" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-[200px] w-full" />
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4">
					{companyData && companyData.length > 0 ? (
						companyData.map((company) => (
							<Card key={company.company_id}>
								<CardHeader>
									<CardTitle>{company.company_name}</CardTitle>
									<CardDescription>
										Symbol: {company.company_id}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<PriceChart companyId={company.company_id} />
								</CardContent>
							</Card>
						))
					) : (
						<div className="col-span-full text-center py-8">
							<p className="text-muted-foreground">No company data available</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
