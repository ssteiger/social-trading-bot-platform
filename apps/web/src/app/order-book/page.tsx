"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { createClient } from "@/utils/supabase/client";
import type { Order } from "@social-trading-bot-platform/db-drizzle";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

/*
CREATE TABLE IF NOT EXISTS "order" (
	"order_id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer NOT NULL,
	"company_id" varchar(10) NOT NULL,
	"order_type" text NOT NULL,
	"is_buy" boolean NOT NULL,
	"price_in_cents" bigint NOT NULL,
	"quantity" bigint NOT NULL,
	"quantity_filled" bigint DEFAULT 0 NOT NULL,
	"quantity_open" bigint GENERATED ALWAYS AS ((quantity - quantity_filled)) STORED,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"last_updated_at" timestamp DEFAULT now() NOT NULL
);
*/

// Define the columns with proper typing
const columns: ColumnDef<Order>[] = [
	{
		accessorKey: "order_id",
		header: "Order ID",
	},
	{
		accessorKey: "company_id",
		header: "Company Ticker",
	},
	{
		accessorKey: "order_type",
		header: "Order Type",
	},
	{
		accessorKey: "is_buy",
		header: "Direction",
		cell: ({ row }) => (row.getValue("is_buy") ? "Buy" : "Sell"),
	},
	{
		accessorKey: "price_in_cents",
		header: "Price",
		cell: ({ row }) => {
			const priceInCents = row.getValue("price_in_cents") as number;
			return `$${(priceInCents / 100).toFixed(2)}`;
		},
	},
	{
		accessorKey: "quantity",
		header: "Quantity",
	},
	{
		accessorKey: "quantity_filled",
		header: "Filled",
	},
	{
		accessorKey: "quantity_open",
		header: "Open",
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return (
				<span
					className={`capitalize ${status === "pending" ? "text-yellow-500" : status === "filled" ? "text-green-500" : "text-red-500"}`}
				>
					{status}
				</span>
			);
		},
	},
	{
		accessorKey: "created_at",
		header: "Created",
		cell: ({ row }) => {
			const date = new Date(row.getValue("created_at") as string);
			return date.toLocaleString();
		},
	},
	{
		accessorKey: "expires_at",
		header: "Expires",
		cell: ({ row }) => {
			const date = row.getValue("expires_at") as string;
			return date ? new Date(date).toLocaleString() : "N/A";
		},
	},
];

export default function OrderBookPage() {
	const { data: companyData, isLoading } = useQuery({
		queryKey: ["market-overview"],
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase.from("order").select("*");

			if (error) throw error;
			return data;
		},
	});

	return (
		<div className="flex-1 space-y-4 p-8 pt-6">
			<Card>
				<CardHeader>
					<CardTitle>Order Book</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable data={companyData || []} columns={columns} />
				</CardContent>
			</Card>
		</div>
	);
}
