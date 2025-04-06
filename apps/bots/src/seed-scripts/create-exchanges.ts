import type { SupabaseClient } from '@supabase/supabase-js'

/*
create table public.exchanges (
  exchange_id serial not null,
  exchange_name character varying(100) not null,
  exchange_code character varying(10) not null,
  trading_fee_percent numeric(5, 2) not null default 0.1,
  is_active boolean not null default true,
  created_at timestamp without time zone not null default now(),
  constraint exchanges_pkey primary key (exchange_id),
  constraint exchanges_exchange_code_key unique (exchange_code)
) TABLESPACE pg_default;
*/

async function createExchanges(supabase: SupabaseClient) {
  const exchanges = [
    {
      exchange_id: 'HAM',
      exchange_name: 'Hamburg Stock Exchange',
      exchange_code: 'HAM',
      trading_fee_percent: 0.15,
      is_active: true,
    },
    /*
		{
			exchange_name: "Berlin Stock Exchange",
			exchange_code: "BER",
			trading_fee_percent: 0.12,
			is_active: true,
		},
		{
			exchange_name: "Munich Stock Exchange",
			exchange_code: "MUN",
			trading_fee_percent: 0.1,
			is_active: true,
		},
		*/
  ]

  console.log('Creating exchanges...')

  const { data, error } = await supabase
    .from('exchange')
    .upsert(exchanges, { onConflict: 'exchange_code' })
    .select()

  if (error) {
    console.error('Error creating exchanges:', error)
    throw error
  }

  console.log(`Created ${data?.length} exchanges successfully.`)
  return data
}

export { createExchanges }
