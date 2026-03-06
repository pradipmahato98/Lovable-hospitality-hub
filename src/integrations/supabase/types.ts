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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_records: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          type: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          type?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ota_sync_logs: {
        Row: {
          created_at: string
          direction: string
          id: string
          message: string | null
          ota_name: string
          payload: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          direction: string
          id?: string
          message?: string | null
          ota_name: string
          payload?: Json | null
          status: string
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          message?: string | null
          ota_name?: string
          payload?: Json | null
          status?: string
        }
        Relationships: []
      }
      banquet_events: {
        Row: {
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string | null
          deposit_amount: number | null
          end_time: string
          event_date: string
          event_name: string
          event_type: string
          guest_count: number | null
          id: string
          menu_package: string | null
          notes: string | null
          special_requests: string | null
          start_time: string
          status: string | null
          total_amount: number | null
          updated_at: string | null
          venue: string
        }
        Insert: {
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          end_time: string
          event_date: string
          event_name: string
          event_type: string
          guest_count?: number | null
          id?: string
          menu_package?: string | null
          notes?: string | null
          special_requests?: string | null
          start_time: string
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          venue: string
        }
        Update: {
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          end_time?: string
          event_date?: string
          event_name?: string
          event_type?: string
          guest_count?: number | null
          id?: string
          menu_package?: string | null
          notes?: string | null
          special_requests?: string | null
          start_time?: string
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          venue?: string
        }
        Relationships: []
      }
      booking_sources: {
        Row: {
          code: string
          commission_percentage: number
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          commission_percentage?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          commission_percentage?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_catering: {
        Row: {
          beverage_selections: Json | null
          created_at: string
          dietary_requirements: Json | null
          event_id: string
          guest_count: number | null
          id: string
          menu_package: string | null
          serving_style: string | null
          serving_time: string | null
          special_instructions: string | null
          status: string
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          beverage_selections?: Json | null
          created_at?: string
          dietary_requirements?: Json | null
          event_id: string
          guest_count?: number | null
          id?: string
          menu_package?: string | null
          serving_style?: string | null
          serving_time?: string | null
          special_instructions?: string | null
          status?: string
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          beverage_selections?: Json | null
          created_at?: string
          dietary_requirements?: Json | null
          event_id?: string
          guest_count?: number | null
          id?: string
          menu_package?: string | null
          serving_style?: string | null
          serving_time?: string | null
          special_instructions?: string | null
          status?: string
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_catering_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "banquet_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff_assignments: {
        Row: {
          created_at: string
          end_time: string | null
          event_id: string
          id: string
          notes: string | null
          role: string
          staff_id: string | null
          staff_name: string | null
          start_time: string | null
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          event_id: string
          id?: string
          notes?: string | null
          role: string
          staff_id?: string | null
          staff_name?: string | null
          start_time?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          role?: string
          staff_id?: string | null
          staff_name?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "banquet_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      event_venue_setups: {
        Row: {
          breakdown_time: string | null
          capacity: number | null
          created_at: string
          decoration_checklist: Json | null
          equipment_needed: Json | null
          event_id: string
          floor_plan_url: string | null
          id: string
          layout_type: string | null
          notes: string | null
          setup_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          breakdown_time?: string | null
          capacity?: number | null
          created_at?: string
          decoration_checklist?: Json | null
          equipment_needed?: Json | null
          event_id: string
          floor_plan_url?: string | null
          id?: string
          layout_type?: string | null
          notes?: string | null
          setup_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          breakdown_time?: string | null
          capacity?: number | null
          created_at?: string
          decoration_checklist?: Json | null
          equipment_needed?: Json | null
          event_id?: string
          floor_plan_url?: string | null
          id?: string
          layout_type?: string | null
          notes?: string | null
          setup_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_venue_setups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "banquet_events"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          expense_number: string
          id: string
          notes: string | null
          paid_at: string | null
          receipt_url: string | null
          status: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          expense_number: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          receipt_url?: string | null
          status?: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          expense_number?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          receipt_url?: string | null
          status?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_communications: {
        Row: {
          channel: string
          created_at: string
          direction: string
          guest_id: string
          id: string
          message: string
          sent_by: string | null
          status: string
          subject: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          direction: string
          guest_id: string
          id?: string
          message: string
          sent_by?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          direction?: string
          guest_id?: string
          id?: string
          message?: string
          sent_by?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_communications_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_feedback: {
        Row: {
          created_at: string
          department: string | null
          feedback_type: string
          guest_id: string | null
          id: string
          message: string
          rating: number | null
          reservation_id: string | null
          responded_at: string | null
          responded_by: string | null
          response: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          feedback_type: string
          guest_id?: string | null
          id?: string
          message: string
          rating?: number | null
          reservation_id?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          feedback_type?: string
          guest_id?: string | null
          id?: string
          message?: string
          rating?: number | null
          reservation_id?: string | null
          responded_at?: string | null
          responded_by?: string | null
          response?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_feedback_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_feedback_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_preferences: {
        Row: {
          category: string
          created_at: string
          guest_id: string
          id: string
          preference_key: string
          preference_value: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          guest_id: string
          id?: string
          preference_key: string
          preference_value?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          guest_id?: string
          id?: string
          preference_key?: string
          preference_value?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_preferences_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          gender: string | null
          id: string
          id_image_url: string | null
          id_number: string | null
          id_type: string | null
          image_url: string | null
          is_vip: boolean | null
          job_title: string | null
          last_name: string
          nationality: string | null
          notes: string | null
          phone: string | null
          region: string | null
          state_province: string | null
          subscribed_property: string | null
          title: string | null
          total_spending: number | null
          total_visits: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          id?: string
          id_image_url?: string | null
          id_number?: string | null
          id_type?: string | null
          image_url?: string | null
          is_vip?: boolean | null
          job_title?: string | null
          last_name: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          region?: string | null
          state_province?: string | null
          subscribed_property?: string | null
          title?: string | null
          total_spending?: number | null
          total_visits?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          id_image_url?: string | null
          id_number?: string | null
          id_type?: string | null
          image_url?: string | null
          is_vip?: boolean | null
          job_title?: string | null
          last_name?: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          region?: string | null
          state_province?: string | null
          subscribed_property?: string | null
          title?: string | null
          total_spending?: number | null
          total_visits?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      housekeeping_inspections: {
        Row: {
          amenities_score: number | null
          cleanliness_score: number | null
          created_at: string
          id: string
          inspection_date: string
          inspector_id: string | null
          issues: Json | null
          maintenance_score: number | null
          notes: string | null
          overall_score: number | null
          room_id: string
          status: string
        }
        Insert: {
          amenities_score?: number | null
          cleanliness_score?: number | null
          created_at?: string
          id?: string
          inspection_date?: string
          inspector_id?: string | null
          issues?: Json | null
          maintenance_score?: number | null
          notes?: string | null
          overall_score?: number | null
          room_id: string
          status?: string
        }
        Update: {
          amenities_score?: number | null
          cleanliness_score?: number | null
          created_at?: string
          id?: string
          inspection_date?: string
          inspector_id?: string | null
          issues?: Json | null
          maintenance_score?: number | null
          notes?: string | null
          overall_score?: number | null
          room_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "housekeeping_inspections_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      housekeeping_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          id: string
          inspection_notes: string | null
          inspection_score: number | null
          notes: string | null
          priority: string
          room_id: string | null
          scheduled_date: string
          scheduled_time: string | null
          started_at: string | null
          status: string
          task_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          inspection_notes?: string | null
          inspection_score?: number | null
          notes?: string | null
          priority?: string
          room_id?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          started_at?: string | null
          status?: string
          task_type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          inspection_notes?: string | null
          inspection_score?: number | null
          notes?: string | null
          priority?: string
          room_id?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          started_at?: string | null
          status?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "housekeeping_tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category_id: string | null
          cost_price: number
          created_at: string
          current_stock: number
          department: string | null
          id: string
          is_active: boolean
          last_restocked_at: string | null
          location: string | null
          max_stock: number | null
          min_stock: number
          name: string
          reorder_point: number
          selling_price: number | null
          sku: string | null
          supplier_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cost_price?: number
          created_at?: string
          current_stock?: number
          department?: string | null
          id?: string
          is_active?: boolean
          last_restocked_at?: string | null
          location?: string | null
          max_stock?: number | null
          min_stock?: number
          name: string
          reorder_point?: number
          selling_price?: number | null
          sku?: string | null
          supplier_id?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cost_price?: number
          created_at?: string
          current_stock?: number
          department?: string | null
          id?: string
          is_active?: boolean
          last_restocked_at?: string | null
          location?: string | null
          max_stock?: number | null
          min_stock?: number
          name?: string
          reorder_point?: number
          selling_price?: number | null
          sku?: string | null
          supplier_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          tax_amount: number | null
          tax_rate: number | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          balance_due: number
          company_id: string | null
          created_at: string
          created_by: string | null
          discount_amount: number
          due_date: string | null
          guest_id: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          reservation_id: string | null
          status: string
          subtotal: number
          tax_amount: number
          terms: string | null
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          balance_due?: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_date?: string | null
          guest_id?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          reservation_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          balance_due?: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_date?: string | null
          guest_id?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          reservation_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          terms?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "pos_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          description: string
          entry_number: string
          id: string
          is_posted: boolean | null
          reference: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          description: string
          entry_number: string
          id?: string
          is_posted?: boolean | null
          reference?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string
          entry_number?: string
          id?: string
          is_posted?: boolean | null
          reference?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      journal_lines: {
        Row: {
          account_id: string
          created_at: string | null
          credit: number | null
          debit: number | null
          description: string | null
          id: string
          journal_entry_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          journal_entry_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          created_at: string
          entitled_days: number
          id: string
          leave_type: string
          pending_days: number
          remaining_days: number | null
          staff_id: string
          updated_at: string
          used_days: number
          year: number
        }
        Insert: {
          created_at?: string
          entitled_days?: number
          id?: string
          leave_type: string
          pending_days?: number
          remaining_days?: number | null
          staff_id: string
          updated_at?: string
          used_days?: number
          year: number
        }
        Update: {
          created_at?: string
          entitled_days?: number
          id?: string
          leave_type?: string
          pending_days?: number
          remaining_days?: number | null
          staff_id?: string
          updated_at?: string
          used_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          days_requested: number
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          rejection_reason: string | null
          staff_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_requested: number
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          rejection_reason?: string | null
          staff_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days_requested?: number
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          rejection_reason?: string | null
          staff_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_and_found: {
        Row: {
          category: string | null
          claimed_by: string | null
          claimed_date: string | null
          created_at: string
          found_by: string | null
          found_date: string
          found_location: string
          guest_id: string | null
          id: string
          image_url: string | null
          item_description: string
          notes: string | null
          status: string
          storage_location: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          claimed_by?: string | null
          claimed_date?: string | null
          created_at?: string
          found_by?: string | null
          found_date?: string
          found_location: string
          guest_id?: string | null
          id?: string
          image_url?: string | null
          item_description: string
          notes?: string | null
          status?: string
          storage_location?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          claimed_by?: string | null
          claimed_date?: string | null
          created_at?: string
          found_by?: string | null
          found_date?: string
          found_location?: string
          guest_id?: string | null
          id?: string
          image_url?: string | null
          item_description?: string
          notes?: string | null
          status?: string
          storage_location?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_and_found_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_members: {
        Row: {
          created_at: string
          guest_id: string
          id: string
          inactive_date: string | null
          is_active: boolean
          join_date: string
          journey_start_date: string | null
          lifetime_points: number
          member_number: string
          points_balance: number
          property_name: string | null
          referred_by: string | null
          tier: string
          tier_expiry: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          id?: string
          inactive_date?: string | null
          is_active?: boolean
          join_date?: string
          journey_start_date?: string | null
          lifetime_points?: number
          member_number: string
          points_balance?: number
          property_name?: string | null
          referred_by?: string | null
          tier?: string
          tier_expiry?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          id?: string
          inactive_date?: string | null
          is_active?: boolean
          join_date?: string
          journey_start_date?: string | null
          lifetime_points?: number
          member_number?: string
          points_balance?: number
          property_name?: string | null
          referred_by?: string | null
          tier?: string
          tier_expiry?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_members_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: true
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          member_id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          member_id: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          member_id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "loyalty_members"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          category: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ota_channels: {
        Row: {
          api_endpoint: string | null
          code: string
          commission_rate: number | null
          created_at: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          name: string
          settings: Json | null
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          code: string
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          name: string
          settings?: Json | null
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          code?: string
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          name?: string
          settings?: Json | null
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          guest_id: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string
          payment_number: string
          received_by: string | null
          reference_number: string | null
          reservation_id: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          guest_id?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method: string
          payment_number: string
          received_by?: string | null
          reference_number?: string | null
          reservation_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          guest_id?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_number?: string
          received_by?: string | null
          reference_number?: string | null
          reservation_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          allowances: number | null
          basic_salary: number
          created_at: string
          deductions: number | null
          id: string
          net_pay: number
          notes: string | null
          overtime_hours: number | null
          overtime_pay: number | null
          paid_date: string | null
          pay_period_end: string
          pay_period_start: string
          payment_method: string | null
          staff_id: string
          status: string
          tax_amount: number | null
          updated_at: string
        }
        Insert: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string
          deductions?: number | null
          id?: string
          net_pay: number
          notes?: string | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          paid_date?: string | null
          pay_period_end: string
          pay_period_start: string
          payment_method?: string | null
          staff_id: string
          status?: string
          tax_amount?: number | null
          updated_at?: string
        }
        Update: {
          allowances?: number | null
          basic_salary?: number
          created_at?: string
          deductions?: number | null
          id?: string
          net_pay?: number
          notes?: string | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          paid_date?: string | null
          pay_period_end?: string
          pay_period_start?: string
          payment_method?: string | null
          staff_id?: string
          status?: string
          tax_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_companies: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          pan_number: string | null
          phone: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          pan_number?: string | null
          phone?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          pan_number?: string | null
          phone?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      pos_order_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          item_name: string
          item_price: number
          notes: string | null
          order_id: string | null
          quantity: number
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          item_name: string
          item_price: number
          notes?: string | null
          order_id?: string | null
          quantity?: number
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          item_name?: string
          item_price?: number
          notes?: string | null
          order_id?: string | null
          quantity?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_orders: {
        Row: {
          created_at: string
          discount_amount: number | null
          guests: number | null
          id: string
          server_name: string | null
          start_time: string | null
          status: string
          subtotal: number | null
          table_id: string | null
          table_number: string
          tax_amount: number | null
          tip_amount: number | null
          total: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          guests?: number | null
          id?: string
          server_name?: string | null
          start_time?: string | null
          status?: string
          subtotal?: number | null
          table_id?: string | null
          table_number: string
          tax_amount?: number | null
          tip_amount?: number | null
          total?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          guests?: number | null
          id?: string
          server_name?: string | null
          start_time?: string | null
          status?: string
          subtotal?: number | null
          table_id?: string | null
          table_number?: string
          tax_amount?: number | null
          tip_amount?: number | null
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "pos_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_tables: {
        Row: {
          capacity: number
          created_at: string
          current_order: Json | null
          guests: number | null
          id: string
          merged_with: string[] | null
          server_name: string | null
          start_time: string | null
          status: string
          table_number: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          current_order?: Json | null
          guests?: number | null
          id?: string
          merged_with?: string[] | null
          server_name?: string | null
          start_time?: string | null
          status?: string
          table_number: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          current_order?: Json | null
          guests?: number | null
          id?: string
          merged_with?: string[] | null
          server_name?: string | null
          start_time?: string | null
          status?: string
          table_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      pos_transactions: {
        Row: {
          card_last_four: string | null
          card_type: string | null
          company_id: string | null
          company_name: string | null
          created_at: string
          customer_address: string | null
          customer_name: string | null
          discount_amount: number | null
          id: string
          items: Json
          items_count: number
          order_id: string | null
          pan_number: string | null
          payment_method: string
          room_number: string | null
          rrn_number: string | null
          subtotal: number
          table_number: string
          tax_amount: number
          tip_amount: number | null
          total: number
          transaction_number: string
          transaction_ref: string | null
          vat_number: string | null
        }
        Insert: {
          card_last_four?: string | null
          card_type?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          discount_amount?: number | null
          id?: string
          items?: Json
          items_count: number
          order_id?: string | null
          pan_number?: string | null
          payment_method: string
          room_number?: string | null
          rrn_number?: string | null
          subtotal: number
          table_number: string
          tax_amount: number
          tip_amount?: number | null
          total: number
          transaction_number: string
          transaction_ref?: string | null
          vat_number?: string | null
        }
        Update: {
          card_last_four?: string | null
          card_type?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          discount_amount?: number | null
          id?: string
          items?: Json
          items_count?: number
          order_id?: string | null
          pan_number?: string | null
          payment_method?: string
          room_number?: string | null
          rrn_number?: string | null
          subtotal?: number
          table_number?: string
          tax_amount?: number
          tip_amount?: number | null
          total?: number
          transaction_number?: string
          transaction_ref?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "pos_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pos_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          blocked_reason: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_blocked: boolean | null
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          blocked_reason?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_blocked?: boolean | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          blocked_reason?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_blocked?: boolean | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          purchase_order_id: string
          quantity: number
          received_quantity: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          purchase_order_id: string
          quantity: number
          received_quantity?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          expected_delivery: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          received_date: string | null
          status: string
          subtotal: number
          supplier_id: string | null
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          received_date?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          received_date?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_availability: {
        Row: {
          available_count: number
          closed_to_arrival: boolean | null
          closed_to_departure: boolean | null
          created_at: string
          date: string
          id: string
          max_stay: number | null
          min_stay: number | null
          rate: number
          room_id: string
          updated_at: string
        }
        Insert: {
          available_count?: number
          closed_to_arrival?: boolean | null
          closed_to_departure?: boolean | null
          created_at?: string
          date: string
          id?: string
          max_stay?: number | null
          min_stay?: number | null
          rate: number
          room_id: string
          updated_at?: string
        }
        Update: {
          available_count?: number
          closed_to_arrival?: boolean | null
          closed_to_departure?: boolean | null
          created_at?: string
          date?: string
          id?: string
          max_stay?: number | null
          min_stay?: number | null
          rate?: number
          room_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_availability_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_plans: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_percentage: number
          id: string
          is_active: boolean
          is_system: boolean
          max_nights: number | null
          min_nights: number | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_percentage?: number
          id?: string
          is_active?: boolean
          is_system?: boolean
          max_nights?: number | null
          min_nights?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_percentage?: number
          id?: string
          is_active?: boolean
          is_system?: boolean
          max_nights?: number | null
          min_nights?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          actual_check_in: string | null
          actual_check_out: string | null
          adults: number
          amount_paid: number | null
          check_in_date: string
          check_out_date: string
          children: number | null
          created_at: string
          created_by: string | null
          guest_id: string
          id: string
          payment_status: string | null
          rejection_reason: string | null
          reservation_code: string
          room_id: string
          source: string | null
          special_requests: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          actual_check_in?: string | null
          actual_check_out?: string | null
          adults?: number
          amount_paid?: number | null
          check_in_date: string
          check_out_date: string
          children?: number | null
          created_at?: string
          created_by?: string | null
          guest_id: string
          id?: string
          payment_status?: string | null
          rejection_reason?: string | null
          reservation_code: string
          room_id: string
          source?: string | null
          special_requests?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          actual_check_in?: string | null
          actual_check_out?: string | null
          adults?: number
          amount_paid?: number | null
          check_in_date?: string
          check_out_date?: string
          children?: number | null
          created_at?: string
          created_by?: string | null
          guest_id?: string
          id?: string
          payment_status?: string | null
          rejection_reason?: string | null
          reservation_code?: string
          room_id?: string
          source?: string | null
          special_requests?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          permission: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          permission: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          permission?: string
        }
        Relationships: []
      }
      role_change_audit: {
        Row: {
          changed_by_user_id: string
          created_at: string
          id: string
          new_role: string
          old_role: string
          reason: string | null
          user_id: string
        }
        Insert: {
          changed_by_user_id: string
          created_at?: string
          id?: string
          new_role: string
          old_role: string
          reason?: string | null
          user_id: string
        }
        Update: {
          changed_by_user_id?: string
          created_at?: string
          id?: string
          new_role?: string
          old_role?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          amenities: string[] | null
          capacity: number
          created_at: string
          description: string | null
          floor: number
          id: string
          image_url: string | null
          is_active: boolean | null
          price_per_night: number
          room_number: string
          room_type: string
          status: string
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          description?: string | null
          floor: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price_per_night: number
          room_number: string
          room_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          capacity?: number
          created_at?: string
          description?: string | null
          floor?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price_per_night?: number
          room_number?: string
          room_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          created_at: string
          department: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string
          first_name: string
          hire_date: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          position: string
          salary: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id: string
          first_name: string
          hire_date?: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          position: string
          salary?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string
          first_name?: string
          hire_date?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          position?: string
          salary?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      staff_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          department: string | null
          id: string
          notes: string | null
          position: string | null
          shift_date: string
          shift_end: string
          shift_start: string
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          id?: string
          notes?: string | null
          position?: string | null
          shift_date: string
          shift_end: string
          shift_start: string
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string | null
          id?: string
          notes?: string | null
          position?: string | null
          shift_date?: string
          shift_end?: string
          shift_start?: string
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_time_clock: {
        Row: {
          break_minutes: number | null
          clock_in: string
          clock_out: string | null
          created_at: string
          id: string
          notes: string | null
          staff_id: string | null
        }
        Insert: {
          break_minutes?: number | null
          clock_in: string
          clock_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          staff_id?: string | null
        }
        Update: {
          break_minutes?: number | null
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_time_clock_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          from_location: string | null
          id: string
          item_id: string
          movement_type: string
          notes: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          to_location: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_location?: string | null
          id?: string
          item_id: string
          movement_type: string
          notes?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          to_location?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_location?: string | null
          id?: string
          item_id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          to_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tax_rates: {
        Row: {
          applies_to: string[] | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          rate: number
          updated_at: string
        }
        Insert: {
          applies_to?: string[] | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          rate: number
          updated_at?: string
        }
        Update: {
          applies_to?: string[] | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      guest_folios: {
        Row: {
          id: string
          reservation_id: string | null
          room_id: string | null
          guest_id: string | null
          folio_number: string
          status: string
          total_charges: number
          total_payments: number
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reservation_id?: string | null
          room_id?: string | null
          guest_id?: string | null
          folio_number?: string
          status?: string
          total_charges?: number
          total_payments?: number
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string | null
          room_id?: string | null
          guest_id?: string | null
          folio_number?: string
          status?: string
          total_charges?: number
          total_payments?: number
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_folios_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_folios_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_folios_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          }
        ]
      }
      folio_items: {
        Row: {
          id: string
          folio_id: string
          item_type: string
          source: string
          description: string
          amount: number
          reference_id: string | null
          reason: string | null
          modified_by: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          folio_id: string
          item_type: string
          source: string
          description: string
          amount: number
          reference_id?: string | null
          reason?: string | null
          modified_by?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          folio_id?: string
          item_type?: string
          source?: string
          description?: string
          amount?: number
          reference_id?: string | null
          reason?: string | null
          modified_by?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folio_items_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "guest_folios"
            referencedColumns: ["id"]
          }
        ]
      }
      routing_rules: {
        Row: {
          id: string
          folio_id: string
          category: string
          target_folio_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          folio_id: string
          category: string
          target_folio_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          folio_id?: string
          category?: string
          target_folio_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routing_rules_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "guest_folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routing_rules_target_folio_id_fkey"
            columns: ["target_folio_id"]
            isOneToOne: false
            referencedRelation: "guest_folios"
            referencedColumns: ["id"]
          }
        ]
      }
      night_audit_logs: {
        Row: {
          id: string
          business_date: string
          performed_by: string | null
          status: string
          total_charges_posted: number | null
          total_room_revenue: number | null
          occupancy_rate: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_date: string
          performed_by?: string | null
          status?: string
          total_charges_posted?: number | null
          total_room_revenue?: number | null
          occupancy_rate?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_date?: string
          performed_by?: string | null
          status?: string
          total_charges_posted?: number | null
          total_room_revenue?: number | null
          occupancy_rate?: number | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      day_close_logs: {
        Row: {
          id: string
          business_date: string
          performed_by: string | null
          total_revenue: number | null
          dept_summaries: Json | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          business_date: string
          performed_by?: string | null
          total_revenue?: number | null
          dept_summaries?: Json | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          business_date?: string
          performed_by?: string | null
          total_revenue?: number | null
          dept_summaries?: Json | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      front_desk_queue: {
        Row: {
          id: string
          guest_name: string
          guest_id: string | null
          reservation_id: string | null
          requested_room_type: string | null
          status: string
          priority: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guest_name: string
          guest_id?: string | null
          reservation_id?: string | null
          requested_room_type?: string | null
          status?: string
          priority?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guest_name?: string
          guest_id?: string | null
          reservation_id?: string | null
          requested_room_type?: string | null
          status?: string
          priority?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "front_desk_queue_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "front_desk_queue_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          }
        ]
      }
      guest_messages: {
        Row: {
          id: string
          guest_id: string
          room_id: string | null
          sender_name: string
          message_text: string
          status: string
          message_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guest_id: string
          room_id?: string | null
          sender_name: string
          message_text: string
          status?: string
          message_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guest_id?: string
          room_id?: string | null
          sender_name?: string
          message_text?: string
          status?: string
          message_type?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_messages_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      guest_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          guest_id: string
          id: string
          staff_id: string | null
          staff_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          guest_id: string
          id?: string
          staff_id?: string | null
          staff_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          guest_id?: string
          id?: string
          staff_id?: string | null
          staff_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_audit_logs_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          }
        ]
      }
      guest_documents: {
        Row: {
          created_at: string
          created_by: string | null
          document_image_url: string | null
          document_number: string | null
          document_type: string | null
          guest_id: string
          id: string
          is_latest: boolean | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_image_url?: string | null
          document_number?: string | null
          document_type?: string | null
          guest_id: string
          id?: string
          is_latest?: boolean | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_image_url?: string | null
          document_number?: string | null
          document_type?: string | null
          guest_id?: string
          id?: string
          is_latest?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_documents_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      post_daily_room_charges: {
        Args: { v_business_date: string }
        Returns: { posted_count: number; total_revenue: number }[]
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "staff" | "user"
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
      app_role: ["admin", "manager", "staff", "user"],
    },
  },
} as const
