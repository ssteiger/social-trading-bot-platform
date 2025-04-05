import { DataTable } from "~/lib/components/ui/data-table";
import type { Bot } from "@social-trading-bot-platform/db-drizzle";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { postgres_db, schema } from "@social-trading-bot-platform/db-drizzle";

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

const serverFn = createServerFn({ method: "GET" })
	//.validator()
	.handler(async () => {
		const bots = await postgres_db.select().from(schema.bot);

		return bots;
	});
  
// Define the columns with proper typing
const columns: ColumnDef<Bot>[] = [
	{
		accessorKey: "bot_id",
		header: "Bot ID",
	},
	{
		accessorKey: "bot_name",
		header: "Bot Name",
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

const BotsPage = () => {
	const { data: bots, isLoading, refetch } = useQuery({
		queryKey: ["bots"],
		queryFn: () => serverFn(),
	});

	return (
		<div className="flex-1">
			<p className="text-muted-foreground">Registered Bots</p>
			<DataTable data={bots || []} columns={columns} isLoading={isLoading} refetch={refetch} />
		</div>
	);
}

export const Route = createFileRoute("/_authenticated/_app/bots/")({
  component: BotsPage,
});
