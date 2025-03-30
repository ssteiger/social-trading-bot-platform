import type { SupabaseClient } from "@supabase/supabase-js";
import { seedData } from "./data";

/*
create table public.companies (
  company_id serial not null,
  creator_bot_id integer not null,
  exchange_id integer not null,
  company_name character varying(100) not null,
  ticker_symbol character varying(10) not null,
  total_shares bigint not null,
  description text null,
  created_at timestamp without time zone not null default now(),
  constraint companies_pkey primary key (company_id),
  constraint companies_exchange_id_ticker_symbol_key unique (exchange_id, ticker_symbol),
  constraint companies_creator_bot_id_fkey foreign KEY (creator_bot_id) references bots (bot_id),
  constraint companies_exchange_id_fkey foreign KEY (exchange_id) references exchanges (exchange_id)
) TABLESPACE pg_default;
*/

async function createCompanies(supabase: SupabaseClient) {
	for (const bot of seedData) {
		// First, query the bot_id using the bot name
		const { data: botData, error: botError } = await supabase
			.from("bots")
			.select("bot_id")
			.eq("bot_name", bot.bot_name)
			.single();

		if (botError) {
			console.error(`Error finding bot ${bot.bot_name}:`, botError);
			continue;
		}

		// Insert the company with the creator_bot_id
		const { data: companyData, error: companyError } = await supabase
			.from("companies")
			.insert({
				creator_bot_id: botData.bot_id,
				exchange_id: bot.company.exchange_id,
				company_name: bot.company.name,
				ticker_symbol: bot.company.ticker_symbol,
				total_shares: bot.company.total_shares,
				description: bot.company.description,
			})
			.select("company_id, company_name, ticker_symbol")
			.single();

		if (companyError) {
			console.error(
				`Error creating company ${bot.company.name}:`,
				companyError,
			);
		} else {
			console.log(
				`Created company: ${companyData.company_name} (${companyData.ticker_symbol})`,
			);
		}
	}
}

export { createCompanies };
