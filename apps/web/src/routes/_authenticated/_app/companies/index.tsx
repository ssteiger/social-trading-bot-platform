import type { Company } from "@social-trading-bot-platform/db-drizzle";
import { postgres_db, schema } from "@social-trading-bot-platform/db-drizzle";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "~/lib/components/ui/data-table";

const serverFn = createServerFn({ method: "GET" })
	//.validator()
	.handler(async ({ context, data }) => {
		const companies = await postgres_db.select().from(schema.company);
    
		return companies;
	});

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

const CompanyPage = () => {
	const { data: companies } = useQuery({
		queryKey: ["company"],
		queryFn: () => serverFn(),
	});

  console.log({ companies })

	return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <p className="text-muted-foreground">Publicly Listed Companies</p>
      <DataTable
        data={companies || []}
        columns={columns}
        searchableColumns={["ticker_symbol", "company_name", "exchange_id"]}
      />
    </div>
	);
};

export const Route = createFileRoute("/_authenticated/_app/companies/")({
	component: CompanyPage,
});
