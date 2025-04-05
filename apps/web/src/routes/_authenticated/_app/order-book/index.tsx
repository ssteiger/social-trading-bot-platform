import { Badge } from "~/lib/components/ui/badge";
import { Button } from "~/lib/components/ui/button";
import { DataTable } from "~/lib/components/ui/data-table";
import { Input } from "~/lib/components/ui/input";
import { Label } from "~/lib/components/ui/label";
import { postgres_db, schema, desc } from "@social-trading-bot-platform/db-drizzle";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/lib/components/ui/select";
import { Separator } from "~/lib/components/ui/separator";
import {
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/lib/components/ui/sheet";
import type { Order } from "@social-trading-bot-platform/db-drizzle";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2Icon, LoaderIcon } from "lucide-react";
import { createServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";

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


const serverFn = createServerFn({ method: "GET" })
	//.validator()
	.handler(async ({ context, data }) => {
		const orders = await postgres_db.select().from(schema.order).orderBy(desc(schema.order.created_at));

    console.log(orders);
		return orders;
	});
  
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
				<Badge
					variant="outline"
					className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
				>
					{status === "filled" ? (
						<CheckCircle2Icon className="text-green-500 dark:text-green-400" />
					) : (
						<LoaderIcon />
					)}
					{status}
				</Badge>
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
  const { data: orders } = useQuery({
		queryKey: ["orders"],
		queryFn: () => serverFn(),
	});

	const rowViewerContent = (item: Order) => (
		<SheetContent side="right" className="flex flex-col">
			<SheetHeader className="gap-1">
				<SheetTitle>Order #{item.order_id}</SheetTitle>
				<SheetDescription>
					{item.is_buy ? "Buy" : "Sell"} order for {item.company_id}
				</SheetDescription>
			</SheetHeader>
			<div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
				<div className="grid gap-2 px-4">
					<div className="flex gap-2 font-medium leading-none">
						Order Status: {item.status}
						{item.status === "filled" ? (
							<CheckCircle2Icon className="size-4 text-green-500" />
						) : (
							<LoaderIcon className="size-4" />
						)}
					</div>
					<div className="text-muted-foreground">
						{item.quantity_filled} of {item.quantity} shares filled (
						{((item.quantity_filled / item.quantity) * 100).toFixed(1)}%)
					</div>
				</div>
				<Separator />
				<form className="flex flex-col gap-4 px-4">
					<div className="flex flex-col gap-3">
						<Label htmlFor="company_id">Company Ticker</Label>
						<Input id="company_id" defaultValue={item.company_id} readOnly />
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="flex flex-col gap-3">
							<Label htmlFor="order_type">Order Type</Label>
							<Select defaultValue={item.order_type}>
								<SelectTrigger id="order_type" className="w-full">
									<SelectValue placeholder="Select order type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="market">Market</SelectItem>
									<SelectItem value="limit">Limit</SelectItem>
									<SelectItem value="stop">Stop</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="direction">Direction</Label>
							<Select defaultValue={item.is_buy ? "buy" : "sell"}>
								<SelectTrigger id="direction" className="w-full">
									<SelectValue placeholder="Select direction" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="buy">Buy</SelectItem>
									<SelectItem value="sell">Sell</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="flex flex-col gap-3">
							<Label htmlFor="price">Price</Label>
							<Input
								id="price"
								defaultValue={(item.price_in_cents / 100).toFixed(2)}
							/>
						</div>
						<div className="flex flex-col gap-3">
							<Label htmlFor="quantity">Quantity</Label>
							<Input id="quantity" defaultValue={item.quantity} />
						</div>
					</div>
					<div className="flex flex-col gap-3">
						<Label htmlFor="status">Status</Label>
						<Select defaultValue={item.status}>
							<SelectTrigger id="status" className="w-full">
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="filled">Filled</SelectItem>
								<SelectItem value="cancelled">Cancelled</SelectItem>
								<SelectItem value="expired">Expired</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</form>
			</div>
			<SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
				<Button className="w-full">Update Order</Button>
				<SheetClose asChild>
					<Button variant="outline" className="w-full">
						Close
					</Button>
				</SheetClose>
			</SheetFooter>
		</SheetContent>
	);

	return (
		<div className="flex-1 space-y-4 p-8 pt-6">
			<p className="text-muted-foreground">Order Book</p>
			<DataTable
				data={orders || []}
				columns={columns}
				rowViewerContent={rowViewerContent}
			/>
		</div>
	);
}

export const Route = createFileRoute("/_authenticated/_app/order-book/")({
  component: OrderBookPage,
});