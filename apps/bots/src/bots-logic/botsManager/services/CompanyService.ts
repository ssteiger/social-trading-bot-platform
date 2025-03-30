import type { SupabaseClient } from "@supabase/supabase-js";
import type { Company, PriceHistory } from "../../../types/drizzle";
import type { Database } from "../../../types/supabase";

export class CompanyService {
	private supabase: SupabaseClient<Database>;

	constructor(supabaseClient: SupabaseClient<Database>) {
		this.supabase = supabaseClient;
	}

	/**
	 * Get all available companies
	 */
	async getCompanies(): Promise<
		(Company & { getCurrentPrice: () => number })[]
	> {
		const { data, error } = await this.supabase.from("company").select("*");

		if (error || !data) {
			console.error("Error getting companies:", error);
			return [];
		}

		// Get current prices for all companies
		const { data: priceData } = await this.supabase
			.from("current_market_price")
			.select("*");

		const priceMap = new Map();
		if (priceData) {
			for (const price of priceData) {
				priceMap.set(price.company_id, price.ask_price);
			}
		}

		// Add current price to each company
		return data.map((company) => ({
			...company,
			getCurrentPrice: () => priceMap.get(company.company_id),
		}));
	}

	/**
	 * Get market data for a company
	 */
	async getCompanyMarketData(
		companyId: number,
		limit = 100,
	): Promise<PriceHistory[]> {
		const { data, error } = await this.supabase
			.from("price_history")
			.select("*")
			.eq("company_id", companyId)
			.eq("period_length", "1min")
			.order("timestamp", { ascending: false })
			.limit(limit);

		if (error || !data) {
			console.error("Error getting market data:", error);
			return [];
		}

		return data;
	}
}
