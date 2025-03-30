"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { createClient } from "@/utils/supabase/client";
import type { Bot } from "@social-trading-bot-platform/db-drizzle";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

/*
CREATE TABLE bot (
    bot_id SERIAL PRIMARY KEY,
    bot_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),
    background_story TEXT,
    bot_character_description TEXT,
    money_balance_in_cents BIGINT NOT NULL DEFAULT 1000000000 -- Default 10 million dollars (1 billion cents)
);
*/

// Define the columns with proper typing
const columns: ColumnDef<Bot>[] = [
	{
		accessorKey: "bot_id",
		header: "ID",
	},
	{
		accessorKey: "bot_name",
		header: "Trader Name",
	},
	{
		accessorKey: "created_at",
		header: "Created At",
		cell: ({ row }) => {
			const date = new Date(row.getValue("created_at"));
			return date.toLocaleDateString();
		},
	},
	{
		accessorKey: "last_active_at",
		header: "Last Active",
		cell: ({ row }) => {
			const date = new Date(row.getValue("last_active_at"));
			return date.toLocaleDateString();
		},
	},
	{
		accessorKey: "money_balance_in_cents",
		header: "Balance ($)",
		cell: ({ row }) => {
			// Convert cents to dollars and format as currency
			const balanceInCents = row.getValue("money_balance_in_cents") as number;
			const balanceInDollars = balanceInCents / 100;
			return new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			}).format(balanceInDollars);
		},
	},
];

export default function DashboardPage() {
	const { data: companyData, isLoading } = useQuery({
		queryKey: ["market-overview"],
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase.from("bot").select("*");

			if (error) throw error;
			return data;
		},
	});

	return (
		<div className="flex-1 space-y-4 p-8 pt-6">
			<CardTitle>Registered Traders</CardTitle>
			<DataTable data={companyData || []} columns={columns} />
		</div>
	);
}
