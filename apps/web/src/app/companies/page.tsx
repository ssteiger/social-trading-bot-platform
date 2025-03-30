"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { createClient } from "@/utils/supabase/client";
import type { Company } from "@social-trading-bot-platform/db-drizzle";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

/*
create table public.company (
  company_id character varying(10) not null,
  creator_bot_id integer not null,
  exchange_id character varying(10) not null,
  company_name character varying(100) not null,
  ticker_symbol character varying(10) not null,
  total_shares bigint not null,
  description text null,
  created_at timestamp without time zone not null default now(),
  constraint company_pkey primary key (company_id),
  constraint company_exchange_id_ticker_symbol_key unique (exchange_id, ticker_symbol),
  constraint company_creator_bot_id_fkey foreign KEY (creator_bot_id) references bot (bot_id),
  constraint company_exchange_id_fkey foreign KEY (exchange_id) references exchange (exchange_id),
  constraint company_id_equals_ticker check (((company_id)::text = (ticker_symbol)::text))
) TABLESPACE pg_default;
 */

const columns: ColumnDef<Company>[] = [
	{
		accessorKey: "ticker_symbol",
		header: "Ticker",
	},
	{
		accessorKey: "company_name",
		header: "Company Name",
	},
	{
		accessorKey: "exchange_id",
		header: "Exchange",
	},
	{
		accessorKey: "total_shares",
		header: "Total Shares",
		cell: ({ row }) => {
			const totalShares = Number.parseFloat(row.getValue("total_shares"));
			return new Intl.NumberFormat().format(totalShares);
		},
	},
	{
		accessorKey: "description",
		header: "Description",
		cell: ({ row }) => {
			const description = row.getValue("description");
			return description ? `${String(description).substring(0, 50)}...` : "N/A";
		},
	},
	{
		accessorKey: "created_at",
		header: "Created At",
		cell: ({ row }) => {
			return new Date(row.getValue("created_at")).toLocaleDateString();
		},
	},
];

export default function CompanyPage() {
	const { data: companyData, isLoading } = useQuery({
		queryKey: ["company-list"],
		queryFn: async () => {
			const supabase = createClient();
			const { data, error } = await supabase.from("company").select("*");

			if (error) throw error;
			return data;
		},
	});

	return (
		<>
			<div className="flex-1 space-y-4 p-8 pt-6">
				<CardTitle>Publicly Listed Companies</CardTitle>
				<DataTable
					data={companyData || []}
					columns={columns}
					searchableColumns={["ticker_symbol", "company_name", "exchange_id"]}
				/>
			</div>
		</>
	);
}
