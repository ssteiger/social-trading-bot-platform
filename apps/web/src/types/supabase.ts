export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bots: {
        Row: {
          api_key: string
          balance: number
          bot_id: number
          bot_name: string
          created_at: string
          last_active_at: string
        }
        Insert: {
          api_key: string
          balance?: number
          bot_id?: number
          bot_name: string
          created_at?: string
          last_active_at?: string
        }
        Update: {
          api_key?: string
          balance?: number
          bot_id?: number
          bot_name?: string
          created_at?: string
          last_active_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          company_id: number
          company_name: string
          created_at: string
          creator_bot_id: number
          description: string | null
          exchange_id: number
          initial_price: number
          ticker_symbol: string
          total_shares: number
        }
        Insert: {
          company_id?: number
          company_name: string
          created_at?: string
          creator_bot_id: number
          description?: string | null
          exchange_id: number
          initial_price: number
          ticker_symbol: string
          total_shares: number
        }
        Update: {
          company_id?: number
          company_name?: string
          created_at?: string
          creator_bot_id?: number
          description?: string | null
          exchange_id?: number
          initial_price?: number
          ticker_symbol?: string
          total_shares?: number
        }
        Relationships: [
          {
            foreignKeyName: "companies_creator_bot_id_fkey"
            columns: ["creator_bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["bot_id"]
          },
          {
            foreignKeyName: "companies_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "exchanges"
            referencedColumns: ["exchange_id"]
          },
        ]
      }
      exchanges: {
        Row: {
          created_at: string
          exchange_code: string
          exchange_id: number
          exchange_name: string
          is_active: boolean
          trading_fee_percent: number
        }
        Insert: {
          created_at?: string
          exchange_code: string
          exchange_id?: number
          exchange_name: string
          is_active?: boolean
          trading_fee_percent?: number
        }
        Update: {
          created_at?: string
          exchange_code?: string
          exchange_id?: number
          exchange_name?: string
          is_active?: boolean
          trading_fee_percent?: number
        }
        Relationships: []
      }
      order_statuses: {
        Row: {
          description: string | null
          status_id: number
          status_name: string
        }
        Insert: {
          description?: string | null
          status_id?: number
          status_name: string
        }
        Update: {
          description?: string | null
          status_id?: number
          status_name?: string
        }
        Relationships: []
      }
      order_types: {
        Row: {
          description: string | null
          order_type_id: number
          type_name: string
        }
        Insert: {
          description?: string | null
          order_type_id?: number
          type_name: string
        }
        Update: {
          description?: string | null
          order_type_id?: number
          type_name?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          bot_id: number
          company_id: number
          created_at: string
          expires_at: string | null
          is_buy: boolean
          last_updated_at: string
          order_id: number
          order_type_id: number
          price: number
          quantity: number
          quantity_filled: number
          status_id: number
        }
        Insert: {
          bot_id: number
          company_id: number
          created_at?: string
          expires_at?: string | null
          is_buy: boolean
          last_updated_at?: string
          order_id?: number
          order_type_id: number
          price: number
          quantity: number
          quantity_filled?: number
          status_id: number
        }
        Update: {
          bot_id?: number
          company_id?: number
          created_at?: string
          expires_at?: string | null
          is_buy?: boolean
          last_updated_at?: string
          order_id?: number
          order_type_id?: number
          price?: number
          quantity?: number
          quantity_filled?: number
          status_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["bot_id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "current_market_prices"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "order_book"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "orders_order_type_id_fkey"
            columns: ["order_type_id"]
            isOneToOne: false
            referencedRelation: "order_types"
            referencedColumns: ["order_type_id"]
          },
          {
            foreignKeyName: "orders_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "order_statuses"
            referencedColumns: ["status_id"]
          },
        ]
      }
      price_history: {
        Row: {
          close_price: number
          company_id: number
          exchange_id: number
          high_price: number
          history_id: number
          low_price: number
          open_price: number
          period_length: string
          timestamp: string
          volume: number
        }
        Insert: {
          close_price: number
          company_id: number
          exchange_id: number
          high_price: number
          history_id?: number
          low_price: number
          open_price: number
          period_length: string
          timestamp: string
          volume: number
        }
        Update: {
          close_price?: number
          company_id?: number
          exchange_id?: number
          high_price?: number
          history_id?: number
          low_price?: number
          open_price?: number
          period_length?: string
          timestamp?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "price_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "current_market_prices"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "price_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "order_book"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "price_history_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "exchanges"
            referencedColumns: ["exchange_id"]
          },
        ]
      }
      shareholdings: {
        Row: {
          average_purchase_price: number | null
          bot_id: number
          company_id: number
          last_updated_at: string
          shareholding_id: number
          shares: number
        }
        Insert: {
          average_purchase_price?: number | null
          bot_id: number
          company_id: number
          last_updated_at?: string
          shareholding_id?: number
          shares?: number
        }
        Update: {
          average_purchase_price?: number | null
          bot_id?: number
          company_id?: number
          last_updated_at?: string
          shareholding_id?: number
          shares?: number
        }
        Relationships: [
          {
            foreignKeyName: "shareholdings_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["bot_id"]
          },
          {
            foreignKeyName: "shareholdings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "shareholdings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "current_market_prices"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "shareholdings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "order_book"
            referencedColumns: ["company_id"]
          },
        ]
      }
      trades: {
        Row: {
          buy_order_id: number
          buyer_bot_id: number
          company_id: number
          exchange_id: number
          executed_at: string
          price: number
          quantity: number
          sell_order_id: number
          seller_bot_id: number
          trade_fee: number
          trade_id: number
        }
        Insert: {
          buy_order_id: number
          buyer_bot_id: number
          company_id: number
          exchange_id: number
          executed_at?: string
          price: number
          quantity: number
          sell_order_id: number
          seller_bot_id: number
          trade_fee: number
          trade_id?: number
        }
        Update: {
          buy_order_id?: number
          buyer_bot_id?: number
          company_id?: number
          exchange_id?: number
          executed_at?: string
          price?: number
          quantity?: number
          sell_order_id?: number
          seller_bot_id?: number
          trade_fee?: number
          trade_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "trades_buy_order_id_fkey"
            columns: ["buy_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "trades_buyer_bot_id_fkey"
            columns: ["buyer_bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["bot_id"]
          },
          {
            foreignKeyName: "trades_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "trades_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "current_market_prices"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "trades_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "order_book"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "trades_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "exchanges"
            referencedColumns: ["exchange_id"]
          },
          {
            foreignKeyName: "trades_sell_order_id_fkey"
            columns: ["sell_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "trades_seller_bot_id_fkey"
            columns: ["seller_bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["bot_id"]
          },
        ]
      }
    }
    Views: {
      current_market_prices: {
        Row: {
          company_id: number | null
          current_price: number | null
          exchange_code: string | null
          exchange_id: number | null
          last_trade_time: string | null
          ticker_symbol: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "exchanges"
            referencedColumns: ["exchange_id"]
          },
        ]
      }
      order_book: {
        Row: {
          company_id: number | null
          exchange_code: string | null
          exchange_id: number | null
          is_buy: boolean | null
          oldest_order_time: string | null
          price: number | null
          ticker_symbol: string | null
          total_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "exchanges"
            referencedColumns: ["exchange_id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

