export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          banner_type: string
          click_count: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          position: number
          start_date: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          banner_type?: string
          click_count?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          position?: number
          start_date?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          banner_type?: string
          click_count?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          position?: number
          start_date?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          fiche_url: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          fiche_url?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          fiche_url?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string | null
          id: string
          product_id: string
          quantity: number
          updated_at: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string | null
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          anonymous_id: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          message: string
          priority: string | null
          replied_at: string | null
          replied_by: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_email: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          message: string
          priority?: string | null
          replied_at?: string | null
          replied_by?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_email: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          replied_at?: string | null
          replied_by?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          unit_price: number | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity: number
          unit_price?: number | null
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          status: Database["public"]["Enums"]["order_status"] | null
          total: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          total?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          total?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          id: string
          product_id: string | null
          url: string
        }
        Insert: {
          alt?: string | null
          id?: string
          product_id?: string | null
          url: string
        }
        Update: {
          alt?: string | null
          id?: string
          product_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ranges: {
        Row: {
          product_id: string
          range_id: string
        }
        Insert: {
          product_id: string
          range_id: string
        }
        Update: {
          product_id?: string
          range_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ranges_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ranges_range_id_fkey"
            columns: ["range_id"]
            isOneToOne: false
            referencedRelation: "ranges"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          product_id: string
          tag_id: string
        }
        Insert: {
          product_id: string
          tag_id: string
        }
        Update: {
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags_with_types"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          slug: string | null
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price: number
          slug?: string | null
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          slug?: string | null
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string | null
          display_name: string | null
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id: string
          is_admin?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ranges: {
        Row: {
          brand_id: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          brand_id: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          brand_id?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "ranges_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_buckets: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      reservation_items: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          product_name: string
          quantity: number
          reservation_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name: string
          quantity: number
          reservation_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          reservation_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_items_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          admin_notes: string | null
          collected_at: string | null
          confirmed_at: string | null
          contact_email: string
          contact_name: string | null
          contact_phone: string
          created_at: string
          currency: string
          expires_at: string
          id: string
          status: Database["public"]["Enums"]["reservation_status"]
          total_items: number
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          collected_at?: string | null
          confirmed_at?: string | null
          contact_email: string
          contact_name?: string | null
          contact_phone: string
          created_at?: string
          currency?: string
          expires_at: string
          id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_items: number
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          collected_at?: string | null
          confirmed_at?: string | null
          contact_email?: string
          contact_name?: string | null
          contact_phone?: string
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_items?: number
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tag_types: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          tag_type_id: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          tag_type_id: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          tag_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_tag_type_id_fkey"
            columns: ["tag_type_id"]
            isOneToOne: false
            referencedRelation: "tag_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      tags_with_types: {
        Row: {
          id: string | null
          name: string | null
          slug: string | null
          tag_type: string | null
          tag_type_id: string | null
          type_color: string | null
          type_icon: string | null
          type_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_tag_type_id_fkey"
            columns: ["tag_type_id"]
            isOneToOne: false
            referencedRelation: "tag_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_to_cart: {
        Args: {
          p_anon_id?: string
          p_cart_id: string
          p_product_id: string
          p_quantity: number
        }
        Returns: undefined
      }
      check_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_sec: number }
        Returns: {
          allowed: boolean
          retry_after: number
        }[]
      }
      cleanup_banner_positions: { Args: never; Returns: undefined }
      create_contact_message: {
        Args: { p_email: string; p_message: string; p_subject: string }
        Returns: Json
      }
      get_messages_stats: { Args: never; Returns: Json }
      get_or_create_cart: {
        Args: { p_anonymous_id?: string; p_user_id?: string }
        Returns: string
      }
      is_user_admin: { Args: { check_user_id: string }; Returns: boolean }
      mark_message_as_read: { Args: { p_message_id: string }; Returns: boolean }
      remove_from_cart: {
        Args: { p_anon_id?: string; p_product_id: string }
        Returns: undefined
      }
      reorder_banners: {
        Args: { banner_id: string; new_position: number; old_position: number }
        Returns: undefined
      }
    }
    Enums: {
      order_status: "pending" | "paid" | "shipped" | "completed" | "cancelled"
      reservation_status:
        | "pending"
        | "confirmed"
        | "collected"
        | "expired"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      order_status: ["pending", "paid", "shipped", "completed", "cancelled"],
      reservation_status: [
        "pending",
        "confirmed",
        "collected",
        "expired",
        "cancelled",
      ],
    },
  },
} as const
