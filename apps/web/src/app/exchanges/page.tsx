"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { createClient } from "@/utils/supabase/client";
import type { Exchange } from "@social-trading-bot-platform/db-drizzle";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

/*
CREATE TABLE IF NOT EXISTS "exchange" (
	"exchange_id" varchar(10) PRIMARY KEY NOT NULL,
	"exchange_name" varchar(100) NOT NULL,
	"exchange_code" varchar(10) NOT NULL,
	"trading_fee_percent" numeric(5, 2) DEFAULT '0.1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exchange_exchange_code_key" UNIQUE("exchange_code"),
	CONSTRAINT "exchange_id_equals_code" CHECK ((exchange_id)::text = (exchange_code)::text)
);
*/

// Define the columns with proper typing
const columns: ColumnDef<Exchange>[] = [
	{
		accessorKey: "exchange_name",
		header: "Exchange Name",
	},
	{
		accessorKey: "exchange_code",
		header: "Code",
	},
	{
		accessorKey: "trading_fee_percent",
		header: "Trading Fee (%)",
		cell: ({ row }) => {
			const fee = Number.parseFloat(row.getValue("trading_fee_percent"));
			return <div>{fee.toFixed(2)}%</div>;
		},
	},
	{
		accessorKey: "is_active",
		header: "Status",
		cell: ({ row }) => {
			const isActive = row.getValue("is_active");
			return (
				<Badge variant={isActive ? "default" : "destructive"}>
					{isActive ? "Active" : "Inactive"}
				</Badge>
			);
		},
	},
	{
		accessorKey: "created_at",
		header: "Created At",
		cell: ({ row }) => {
			const date = new Date(row.getValue("created_at"));
			return <div>{format(date, "PPP")}</div>;
		},
	},
];

export default function ExchangePage() {
	const {
		data: companyData,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ["market-overview"],
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase.from("exchange").select("*");

			if (error) throw error;
			return data;
		},
	});

	return (
		<div className="flex-1 space-y-4 p-8 pt-6">
			<CardTitle>Available Exchanges</CardTitle>
			<DataTable data={companyData || []} columns={columns} />
		</div>
	);
}
