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
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          entity: string
          entity_id: string | null
          id: string
          is_high_impact: boolean
          summary: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          is_high_impact?: boolean
          summary?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          is_high_impact?: boolean
          summary?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          attribution_name: string | null
          attribution_photo_url: string | null
          attribution_title: string | null
          banner_type: string
          click_count: number | null
          created_at: string | null
          description: string | null
          direction: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          position: number
          slot: Database["public"]["Enums"]["banner_slot"]
          start_date: string | null
          status: Database["public"]["Enums"]["banner_status"]
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          attribution_name?: string | null
          attribution_photo_url?: string | null
          attribution_title?: string | null
          banner_type?: string
          click_count?: number | null
          created_at?: string | null
          description?: string | null
          direction?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          position?: number
          slot?: Database["public"]["Enums"]["banner_slot"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["banner_status"]
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          attribution_name?: string | null
          attribution_photo_url?: string | null
          attribution_title?: string | null
          banner_type?: string
          click_count?: number | null
          created_at?: string | null
          description?: string | null
          direction?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          position?: number
          slot?: Database["public"]["Enums"]["banner_slot"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["banner_status"]
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
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_bestsellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_pricing"
            referencedColumns: ["product_id"]
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
          category: string
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
          category?: string
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
          category?: string
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
      cron_heartbeats: {
        Row: {
          job_name: string
          last_result: string | null
          last_run_at: string
        }
        Insert: {
          job_name: string
          last_result?: string | null
          last_run_at?: string
        }
        Update: {
          job_name?: string
          last_result?: string | null
          last_run_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          expense_date: string
          id: string
          label: string | null
          note: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          label?: string | null
          note?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          label?: string | null
          note?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          ip: string | null
          lang: string
          token_expires_at: string | null
          user_agent: string | null
        }
        Insert: {
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          ip?: string | null
          lang?: string
          token_expires_at?: string | null
          user_agent?: string | null
        }
        Update: {
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          ip?: string | null
          lang?: string
          token_expires_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_name: string | null
          body: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          locale: string
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          body?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          locale?: string
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          body?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          locale?: string
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_bestsellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_pricing"
            referencedColumns: ["product_id"]
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
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_bestsellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_pricing"
            referencedColumns: ["product_id"]
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
          benefits: string[] | null
          cost_price: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          inci: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_new: boolean | null
          name: string
          name_search: string | null
          old_price: number | null
          pharmacist_advice: string | null
          pharmacist_name: string | null
          price: number
          range_id: string | null
          skin_type: string[] | null
          slug: string | null
          stock: number | null
          technical_pdf_url: string | null
          texture: string | null
          updated_at: string | null
          usage: string | null
          volume: string | null
        }
        Insert: {
          benefits?: string[] | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          inci?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          name: string
          name_search?: string | null
          old_price?: number | null
          pharmacist_advice?: string | null
          pharmacist_name?: string | null
          price: number
          range_id?: string | null
          skin_type?: string[] | null
          slug?: string | null
          stock?: number | null
          technical_pdf_url?: string | null
          texture?: string | null
          updated_at?: string | null
          usage?: string | null
          volume?: string | null
        }
        Update: {
          benefits?: string[] | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          inci?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          name?: string
          name_search?: string | null
          old_price?: number | null
          pharmacist_advice?: string | null
          pharmacist_name?: string | null
          price?: number
          range_id?: string | null
          skin_type?: string[] | null
          slug?: string | null
          stock?: number | null
          technical_pdf_url?: string | null
          texture?: string | null
          updated_at?: string | null
          usage?: string | null
          volume?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_range_id_fkey"
            columns: ["range_id"]
            isOneToOne: false
            referencedRelation: "ranges"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string | null
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          preferred_locale: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          preferred_locale?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferred_locale?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotion_targets: {
        Row: {
          id: string
          promotion_id: string
          target_id: string
          target_type: string
        }
        Insert: {
          id?: string
          promotion_id: string
          target_id: string
          target_type: string
        }
        Update: {
          id?: string
          promotion_id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_targets_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          is_active: boolean
          name: string
          priority: number
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          start_date?: string
          updated_at?: string
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
          unit_cost: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name: string
          quantity: number
          reservation_id: string
          unit_cost?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          reservation_id?: string
          unit_cost?: number | null
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
            foreignKeyName: "reservation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_bestsellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_pricing"
            referencedColumns: ["product_id"]
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
          anonymous_id: string | null
          collected_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          currency: string
          expires_at: string
          id: string
          source: string
          status: Database["public"]["Enums"]["reservation_status"]
          stock_applied: boolean
          total_items: number
          total_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          anonymous_id?: string | null
          collected_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          expires_at: string
          id?: string
          source?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          stock_applied?: boolean
          total_items: number
          total_price: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          anonymous_id?: string | null
          collected_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          source?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          stock_applied?: boolean
          total_items?: number
          total_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_name: string | null
          body: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          status: string
          title: string | null
          updated_at: string
          user_id: string
          verified_purchase: boolean
        }
        Insert: {
          author_name?: string | null
          body?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
          verified_purchase?: boolean
        }
        Update: {
          author_name?: string | null
          body?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          verified_purchase?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_bestsellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_pricing"
            referencedColumns: ["product_id"]
          },
        ]
      }
      shop_settings: {
        Row: {
          allow_visitor_mode: boolean
          contact_email: string | null
          contact_phone: string | null
          default_mode: string
          home_layout: Json | null
          id: number
          pickup_address: string | null
          pickup_hours: string | null
          pickup_name: string | null
          pickup_phone: string | null
          shipping_interior: number
          shipping_santo_domingo: number
          shop_name: string
          shop_tagline: string | null
          theme: string
          updated_at: string
          updated_by: string | null
          whatsapp_number: string | null
        }
        Insert: {
          allow_visitor_mode?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          default_mode?: string
          home_layout?: Json | null
          id?: number
          pickup_address?: string | null
          pickup_hours?: string | null
          pickup_name?: string | null
          pickup_phone?: string | null
          shipping_interior?: number
          shipping_santo_domingo?: number
          shop_name?: string
          shop_tagline?: string | null
          theme?: string
          updated_at?: string
          updated_by?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          allow_visitor_mode?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          default_mode?: string
          home_layout?: Json | null
          id?: number
          pickup_address?: string | null
          pickup_hours?: string | null
          pickup_name?: string | null
          pickup_phone?: string | null
          shipping_interior?: number
          shipping_santo_domingo?: number
          shop_name?: string
          shop_tagline?: string | null
          theme?: string
          updated_at?: string
          updated_by?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      stock_entries: {
        Row: {
          client_token: string | null
          created_at: string
          created_by: string | null
          id: string
          invoice_date: string | null
          itbis_included: boolean
          ncf: string | null
          note: string | null
          product_id: string
          quantity: number
          supplier_name: string | null
          supplier_rnc: string | null
          unit_cost: number
        }
        Insert: {
          client_token?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_date?: string | null
          itbis_included?: boolean
          ncf?: string | null
          note?: string | null
          product_id: string
          quantity: number
          supplier_name?: string | null
          supplier_rnc?: string | null
          unit_cost: number
        }
        Update: {
          client_token?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_date?: string | null
          itbis_included?: boolean
          ncf?: string | null
          note?: string | null
          product_id?: string
          quantity?: number
          supplier_name?: string | null
          supplier_rnc?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_bestsellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_pricing"
            referencedColumns: ["product_id"]
          },
        ]
      }
      stock_losses: {
        Row: {
          client_token: string | null
          created_at: string
          created_by: string | null
          expense_id: string | null
          id: string
          note: string | null
          product_id: string
          quantity: number
          reason: string
          unit_cost: number | null
        }
        Insert: {
          client_token?: string | null
          created_at?: string
          created_by?: string | null
          expense_id?: string | null
          id?: string
          note?: string | null
          product_id: string
          quantity: number
          reason: string
          unit_cost?: number | null
        }
        Update: {
          client_token?: string | null
          created_at?: string
          created_by?: string | null
          expense_id?: string | null
          id?: string
          note?: string | null
          product_id?: string
          quantity?: number
          reason?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_losses_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_losses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_losses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_bestsellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_losses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_pricing"
            referencedColumns: ["product_id"]
          },
        ]
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
          featured_on_home: boolean | null
          id: string
          name: string
          slug: string
          tag_type_id: string
        }
        Insert: {
          featured_on_home?: boolean | null
          id?: string
          name: string
          slug: string
          tag_type_id: string
        }
        Update: {
          featured_on_home?: boolean | null
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
      wishlists: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_bestsellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_product_pricing"
            referencedColumns: ["product_id"]
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
      v_bestsellers: {
        Row: {
          benefits: string[] | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string | null
          inci: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_new: boolean | null
          name: string | null
          old_price: number | null
          pharmacist_advice: string | null
          pharmacist_name: string | null
          price: number | null
          skin_type: string[] | null
          slug: string | null
          sold_30d: number | null
          stock: number | null
          technical_pdf_url: string | null
          texture: string | null
          updated_at: string | null
          usage: string | null
          volume: string | null
        }
        Relationships: []
      }
      v_product_pricing: {
        Row: {
          base_price: number | null
          currency: string | null
          effective_price: number | null
          product_id: string | null
        }
        Insert: {
          base_price?: number | null
          currency?: string | null
          effective_price?: never
          product_id?: string | null
        }
        Update: {
          base_price?: number | null
          currency?: string | null
          effective_price?: never
          product_id?: string | null
        }
        Relationships: []
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
      apply_reservation_collection: {
        Args: { p_reservation_id: string }
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
      create_guest_reservation: {
        Args: {
          p_anon_id: string
          p_cart_id: string
          p_email?: string
          p_name: string
          p_phone: string
        }
        Returns: {
          confirmation_token: string
          id: string
        }[]
      }
      create_reservation: { Args: { p_cart_id: string }; Returns: string }
      create_ticket: {
        Args: {
          p_category: string
          p_email: string
          p_message: string
          p_subject: string
        }
        Returns: Json
      }
      effective_price: {
        Args: { p_at?: string; p_product_id: string }
        Returns: number
      }
      expire_stale_reservations: { Args: never; Returns: number }
      get_catalogue_page: {
        Args: {
          p_brands?: string[]
          p_page?: number
          p_page_size?: number
          p_q?: string
          p_ranges?: string[]
          p_sort?: string
          p_tags?: Json
        }
        Returns: Json
      }
      get_messages_stats: { Args: never; Returns: Json }
      get_or_create_cart: {
        Args: { p_anonymous_id?: string; p_user_id?: string }
        Returns: string
      }
      immutable_unaccent: { Args: { p_text: string }; Returns: string }
      is_user_admin: { Args: { check_user_id: string }; Returns: boolean }
      merge_anon_cart_to_user: { Args: { p_anon_id: string }; Returns: string }
      recompute_cost_price: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      record_stock_entries: {
        Args: {
          p_client_token: string
          p_created_by: string
          p_invoice_date: string
          p_items: Json
          p_ncf: string
          p_note: string
          p_supplier_name: string
          p_supplier_rnc: string
        }
        Returns: Json
      }
      record_stock_loss: {
        Args: {
          p_client_token: string
          p_created_by: string
          p_note: string
          p_product_id: string
          p_quantity: number
          p_reason: string
        }
        Returns: Json
      }
      remove_from_cart: {
        Args: { p_anon_id?: string; p_product_id: string; p_user_id?: string }
        Returns: undefined
      }
      reorder_banners: {
        Args: { banner_id: string; new_position: number; old_position: number }
        Returns: undefined
      }
      restore_reservation_collection: {
        Args: { p_reservation_id: string }
        Returns: undefined
      }
      set_promotion_targets: {
        Args: { p_promotion_id: string; p_targets: Json }
        Returns: undefined
      }
    }
    Enums: {
      banner_slot: "hero" | "banner" | "card" | "modal"
      banner_status: "draft" | "scheduled" | "active" | "paused" | "expired"
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
      banner_slot: ["hero", "banner", "card", "modal"],
      banner_status: ["draft", "scheduled", "active", "paused", "expired"],
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
