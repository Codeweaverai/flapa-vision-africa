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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string | null
          criteria_type: string
          criteria_value: number
          description: string
          icon_name: string
          id: string
          is_active: boolean
          points: number
          rarity: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          criteria_type: string
          criteria_value?: number
          description: string
          icon_name: string
          id?: string
          is_active?: boolean
          points?: number
          rarity: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria_type?: string
          criteria_value?: number
          description?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          points?: number
          rarity?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          activity_type: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          message: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          message: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          message?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_assistant_interactions: {
        Row: {
          ai_response: string
          course_id: string | null
          created_at: string | null
          id: string
          relevant_content_used: boolean | null
          user_id: string | null
          user_message: string
        }
        Insert: {
          ai_response: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          relevant_content_used?: boolean | null
          user_id?: string | null
          user_message: string
        }
        Update: {
          ai_response?: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          relevant_content_used?: boolean | null
          user_id?: string | null
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_assistant_interactions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_history: {
        Row: {
          action_ids: Json | null
          content: string
          context_data: Json | null
          course_id: string | null
          created_at: string
          id: string
          lesson_id: string | null
          message_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_ids?: Json | null
          content: string
          context_data?: Json | null
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          message_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_ids?: Json | null
          content?: string
          context_data?: Json | null
          course_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          message_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_history_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chat_history_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_course_proposals: {
        Row: {
          category_embedding: string | null
          course_summary_embedding: string | null
          course_title_embedding: string | null
          created_at: string | null
          creator_id: string
          id: string
          prompt_embedding: string | null
          proposal_data: Json
          updated_at: string | null
          user_prompt: string
        }
        Insert: {
          category_embedding?: string | null
          course_summary_embedding?: string | null
          course_title_embedding?: string | null
          created_at?: string | null
          creator_id: string
          id?: string
          prompt_embedding?: string | null
          proposal_data: Json
          updated_at?: string | null
          user_prompt: string
        }
        Update: {
          category_embedding?: string | null
          course_summary_embedding?: string | null
          course_title_embedding?: string | null
          created_at?: string | null
          creator_id?: string
          id?: string
          prompt_embedding?: string | null
          proposal_data?: Json
          updated_at?: string | null
          user_prompt?: string
        }
        Relationships: []
      }
      ai_event_proposals: {
        Row: {
          created_at: string | null
          creator_id: string
          expires_at: string
          id: string
          proposal_data: Json
          workplace_id: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          expires_at?: string
          id?: string
          proposal_data: Json
          workplace_id?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          expires_at?: string
          id?: string
          proposal_data?: Json
          workplace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_event_proposals_workplace_id_fkey"
            columns: ["workplace_id"]
            isOneToOne: false
            referencedRelation: "creator_workplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generation_progress: {
        Row: {
          agent_activity: Json | null
          created_at: string | null
          current_step: string | null
          id: string
          progress_percentage: number | null
          proposal_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_activity?: Json | null
          created_at?: string | null
          current_step?: string | null
          id?: string
          progress_percentage?: number | null
          proposal_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_activity?: Json | null
          created_at?: string | null
          current_step?: string | null
          id?: string
          progress_percentage?: number | null
          proposal_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_costs: {
        Row: {
          created_at: string | null
          description: string | null
          feature_type: string
          id: string
          is_active: boolean | null
          token_cost: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          feature_type: string
          id?: string
          is_active?: boolean | null
          token_cost: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          feature_type?: string
          id?: string
          is_active?: boolean | null
          token_cost?: number
        }
        Relationships: []
      }
      broadcast_messages: {
        Row: {
          admin_id: string
          content: string
          created_at: string
          id: string
          message_type: string
          priority: string
          sent_at: string | null
          status: string
          subject: string
          total_recipients: number | null
        }
        Insert: {
          admin_id: string
          content: string
          created_at?: string
          id?: string
          message_type?: string
          priority?: string
          sent_at?: string | null
          status?: string
          subject: string
          total_recipients?: number | null
        }
        Update: {
          admin_id?: string
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          priority?: string
          sent_at?: string | null
          status?: string
          subject?: string
          total_recipients?: number | null
        }
        Relationships: []
      }
      campaign_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      campaign_contributions: {
        Row: {
          amount: number
          campaign_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          is_anonymous: boolean | null
          message_to_creator: string | null
          net_amount: number | null
          payment_method: string | null
          payment_provider: string | null
          reward_id: string | null
          status: string | null
          supporter_id: string | null
          transaction_fee: number | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_anonymous?: boolean | null
          message_to_creator?: string | null
          net_amount?: number | null
          payment_method?: string | null
          payment_provider?: string | null
          reward_id?: string | null
          status?: string | null
          supporter_id?: string | null
          transaction_fee?: number | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_anonymous?: boolean | null
          message_to_creator?: string | null
          net_amount?: number | null
          payment_method?: string | null
          payment_provider?: string | null
          reward_id?: string | null
          status?: string | null
          supporter_id?: string | null
          transaction_fee?: number | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_contributions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "fundraising_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_contributions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "campaign_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_contributions_supporter_id_fkey"
            columns: ["supporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_rewards: {
        Row: {
          amount: number
          campaign_id: string | null
          claimed_count: number | null
          created_at: string | null
          delivery_estimate: string | null
          description: string | null
          id: string
          stock_limit: number | null
          title: string
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          claimed_count?: number | null
          created_at?: string | null
          delivery_estimate?: string | null
          description?: string | null
          id?: string
          stock_limit?: number | null
          title: string
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          claimed_count?: number | null
          created_at?: string | null
          delivery_estimate?: string | null
          description?: string | null
          id?: string
          stock_limit?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_rewards_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "fundraising_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      card_transactions: {
        Row: {
          amount: number
          bearer: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_state: string | null
          billing_street_address: string | null
          card_bin: string | null
          card_last4: string | null
          card_type: string | null
          completed_at: string | null
          created_at: string | null
          currency: string
          customer_first_name: string | null
          customer_last_name: string | null
          email: string
          fee: number | null
          id: string
          initiated_at: string | null
          lenco_reference: string | null
          payment_status: string
          reason_for_failure: string | null
          redirect_url: string | null
          reference: string
          settlement_status: string | null
          source: string | null
          three_ds_redirect_url: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          bearer?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_address?: string | null
          card_bin?: string | null
          card_last4?: string | null
          card_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          customer_first_name?: string | null
          customer_last_name?: string | null
          email: string
          fee?: number | null
          id?: string
          initiated_at?: string | null
          lenco_reference?: string | null
          payment_status: string
          reason_for_failure?: string | null
          redirect_url?: string | null
          reference: string
          settlement_status?: string | null
          source?: string | null
          three_ds_redirect_url?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          bearer?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          billing_street_address?: string | null
          card_bin?: string | null
          card_last4?: string | null
          card_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          customer_first_name?: string | null
          customer_last_name?: string | null
          email?: string
          fee?: number | null
          id?: string
          initiated_at?: string | null
          lenco_reference?: string | null
          payment_status?: string
          reason_for_failure?: string | null
          redirect_url?: string | null
          reference?: string
          settlement_status?: string | null
          source?: string | null
          three_ds_redirect_url?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      carts: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          price: number
          quantity: number
          session_id: string | null
          ticket_holder_names: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          price: number
          quantity?: number
          session_id?: string | null
          ticket_holder_names?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          price?: number
          quantity?: number
          session_id?: string | null
          ticket_holder_names?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          course_id: string | null
          enrollment_id: string
          id: string
          issue_date: string | null
          pdf_url: string | null
          user_id: string | null
          verification_code: string
        }
        Insert: {
          course_id?: string | null
          enrollment_id: string
          id?: string
          issue_date?: string | null
          pdf_url?: string | null
          user_id?: string | null
          verification_code: string
        }
        Update: {
          course_id?: string | null
          enrollment_id?: string
          id?: string
          issue_date?: string | null
          pdf_url?: string | null
          user_id?: string | null
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          booking_id: string
          check_in_time: string
          checked_in_by: string | null
          created_at: string
          event_id: string
          id: string
          ticket_id: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          check_in_time?: string
          checked_in_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          ticket_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          check_in_time?: string
          checked_in_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "generated_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          like_type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          like_type?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          like_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_messages: {
        Row: {
          channel: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          channel?: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      community_post_images: {
        Row: {
          alt_text: string | null
          created_at: string
          file_size: number
          file_type: string
          id: string
          image_path: string
          image_url: string
          post_id: string
          updated_at: string
          upload_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_size: number
          file_type: string
          id?: string
          image_path: string
          image_url: string
          post_id: string
          updated_at?: string
          upload_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_size?: number
          file_type?: string
          id?: string
          image_path?: string
          image_url?: string
          post_id?: string
          updated_at?: string
          upload_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "community_post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          course_id: string | null
          created_at: string
          emoji_reactions: Json | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string
          emoji_reactions?: Json | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string
          emoji_reactions?: Json | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_bookings: {
        Row: {
          booking_type: string
          created_at: string | null
          duration: number
          id: string
          location: string | null
          mobile_operator: string | null
          notes: string | null
          online_meeting_link: string | null
          payment_amount: number | null
          payment_currency: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string
          phone_number: string | null
          scheduled_time: string
          status: string
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_type: string
          created_at?: string | null
          duration: number
          id?: string
          location?: string | null
          mobile_operator?: string | null
          notes?: string | null
          online_meeting_link?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status: string
          phone_number?: string | null
          scheduled_time: string
          status: string
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_type?: string
          created_at?: string | null
          duration?: number
          id?: string
          location?: string | null
          mobile_operator?: string | null
          notes?: string | null
          online_meeting_link?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string
          phone_number?: string | null
          scheduled_time?: string
          status?: string
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          thread_id: string | null
          token_count: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          thread_id?: string | null
          token_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          thread_id?: string | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_recommendations: {
        Row: {
          created_at: string | null
          id: string
          item_data: Json
          item_id: string
          reason: string | null
          recommendation_type: string
          thread_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_data: Json
          item_id: string
          reason?: string | null
          recommendation_type: string
          thread_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_data?: Json
          item_id?: string
          reason?: string | null
          recommendation_type?: string
          thread_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_recommendations_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_threads: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_threads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      country_currency_mapping: {
        Row: {
          country_code: string
          country_name: string
          currency_code: string
          currency_name: string
          is_active: boolean | null
        }
        Insert: {
          country_code: string
          country_name: string
          currency_code: string
          currency_name: string
          is_active?: boolean | null
        }
        Update: {
          country_code?: string
          country_name?: string
          currency_code?: string
          currency_name?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      course_comments: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_comments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_embeddings: {
        Row: {
          content_text: string
          course_id: string
          created_at: string | null
          embedding: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          content_text: string
          course_id: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          content_text?: string
          course_id?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_embeddings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          completion_date: string | null
          course_id: string
          enrollment_date: string | null
          id: string
          is_completed: boolean | null
          order_id: string | null
          payment_id: string | null
          payment_status: string | null
          user_id: string
        }
        Insert: {
          completion_date?: string | null
          course_id: string
          enrollment_date?: string | null
          id?: string
          is_completed?: boolean | null
          order_id?: string | null
          payment_id?: string | null
          payment_status?: string | null
          user_id: string
        }
        Update: {
          completion_date?: string | null
          course_id?: string
          enrollment_date?: string | null
          id?: string
          is_completed?: boolean | null
          order_id?: string | null
          payment_id?: string | null
          payment_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_favorites: {
        Row: {
          added_at: string
          course_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          course_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string
          course_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_favorites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_learning_outcomes: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          order_index: number
          outcome: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          order_index?: number
          outcome: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          order_index?: number
          outcome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_learning_outcomes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index: number
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_previews: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          preview_video_path: string | null
          preview_video_url: string | null
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          preview_video_path?: string | null
          preview_video_url?: string | null
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          preview_video_path?: string | null
          preview_video_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_previews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          course_id: string
          created_at: string
          id: string
          last_accessed_lesson_id: string | null
          last_lesson_completed: string | null
          progress_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          last_accessed_lesson_id?: string | null
          last_lesson_completed?: string | null
          progress_percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          last_accessed_lesson_id?: string | null
          last_lesson_completed?: string | null
          progress_percentage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_last_accessed_lesson_id_fkey"
            columns: ["last_accessed_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_last_lesson_completed_fkey"
            columns: ["last_lesson_completed"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          rating: number
          review_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_skill_outcomes: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          is_core_skill: boolean | null
          order_index: number
          skill_description: string | null
          skill_level: string | null
          skill_name: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          is_core_skill?: boolean | null
          order_index?: number
          skill_description?: string | null
          skill_level?: string | null
          skill_name: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          is_core_skill?: boolean | null
          order_index?: number
          skill_description?: string | null
          skill_level?: string | null
          skill_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_skill_outcomes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string
          certificate_enabled: boolean | null
          created_at: string | null
          creator_id: string | null
          description: string
          difficulty_level: string
          duration_minutes: number
          id: string
          is_free: boolean | null
          is_published: boolean | null
          price: number | null
          summary: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          workplace_id: string | null
        }
        Insert: {
          category: string
          certificate_enabled?: boolean | null
          created_at?: string | null
          creator_id?: string | null
          description: string
          difficulty_level: string
          duration_minutes: number
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          price?: number | null
          summary: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          workplace_id?: string | null
        }
        Update: {
          category?: string
          certificate_enabled?: boolean | null
          created_at?: string | null
          creator_id?: string | null
          description?: string
          difficulty_level?: string
          duration_minutes?: number
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          price?: number | null
          summary?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          workplace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_workplace_id_fkey"
            columns: ["workplace_id"]
            isOneToOne: false
            referencedRelation: "creator_workplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_payouts: {
        Row: {
          amount: number
          bank_transfer_details: Json | null
          completed_at: string | null
          created_at: string
          creator_id: string
          currency: string
          destination: string
          environment: string | null
          external_reference: string | null
          failure_reason: string | null
          fee: number | null
          id: string
          lenco_reference: string | null
          method: string
          minimum_threshold_met: boolean | null
          mobile_money_details: Json | null
          pawapay_deposit_id: string | null
          payout_method: string | null
          provider_payout_id: string | null
          status: string
          stripe_payout_id: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bank_transfer_details?: Json | null
          completed_at?: string | null
          created_at?: string
          creator_id: string
          currency?: string
          destination: string
          environment?: string | null
          external_reference?: string | null
          failure_reason?: string | null
          fee?: number | null
          id?: string
          lenco_reference?: string | null
          method: string
          minimum_threshold_met?: boolean | null
          mobile_money_details?: Json | null
          pawapay_deposit_id?: string | null
          payout_method?: string | null
          provider_payout_id?: string | null
          status?: string
          stripe_payout_id?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_transfer_details?: Json | null
          completed_at?: string | null
          created_at?: string
          creator_id?: string
          currency?: string
          destination?: string
          environment?: string | null
          external_reference?: string | null
          failure_reason?: string | null
          fee?: number | null
          id?: string
          lenco_reference?: string | null
          method?: string
          minimum_threshold_met?: boolean | null
          mobile_money_details?: Json | null
          pawapay_deposit_id?: string | null
          payout_method?: string | null
          provider_payout_id?: string | null
          status?: string
          stripe_payout_id?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      creator_workplace_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          declined_at: string | null
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          invited_email: string
          role: string
          status: string
          workplace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          declined_at?: string | null
          expires_at?: string
          id?: string
          invitation_token: string
          invited_by: string
          invited_email: string
          role?: string
          status?: string
          workplace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          declined_at?: string | null
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          invited_email?: string
          role?: string
          status?: string
          workplace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_workplace_invitations_workplace_id_fkey"
            columns: ["workplace_id"]
            isOneToOne: false
            referencedRelation: "creator_workplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_workplace_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["workplace_role"]
          status: string
          updated_at: string
          user_id: string
          workplace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["workplace_role"]
          status?: string
          updated_at?: string
          user_id: string
          workplace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["workplace_role"]
          status?: string
          updated_at?: string
          user_id?: string
          workplace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_workplace_members_workplace_id_fkey"
            columns: ["workplace_id"]
            isOneToOne: false
            referencedRelation: "creator_workplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_workplaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_embeddings: {
        Row: {
          content: string
          course_id: string | null
          created_at: string | null
          embedding: string | null
          id: string
          lesson_id: string | null
          metadata: Json
          updated_at: string | null
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          lesson_id?: string | null
          metadata: Json
          updated_at?: string | null
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          lesson_id?: string | null
          metadata?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_embeddings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_embeddings_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      event_agenda: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          event_id: string
          id: string
          location: string | null
          order_index: number
          session_type: string
          speaker_id: string | null
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          event_id: string
          id?: string
          location?: string | null
          order_index?: number
          session_type?: string
          speaker_id?: string | null
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          event_id?: string
          id?: string
          location?: string | null
          order_index?: number
          session_type?: string
          speaker_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_agenda_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_agenda_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "keynote_speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      event_bookings: {
        Row: {
          booking_code: string | null
          booking_date: string | null
          created_at: string | null
          event_id: string
          event_ticket_id: string | null
          id: string
          mobile_operator: string | null
          order_id: string | null
          payment_amount: number | null
          payment_currency: string | null
          payment_id: string | null
          payment_status: string | null
          phone_number: string | null
          status: string | null
          ticket_quantity: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_code?: string | null
          booking_date?: string | null
          created_at?: string | null
          event_id: string
          event_ticket_id?: string | null
          id?: string
          mobile_operator?: string | null
          order_id?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_status?: string | null
          phone_number?: string | null
          status?: string | null
          ticket_quantity?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_code?: string | null
          booking_date?: string | null
          created_at?: string | null
          event_id?: string
          event_ticket_id?: string | null
          id?: string
          mobile_operator?: string | null
          order_id?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_status?: string | null
          phone_number?: string | null
          status?: string | null
          ticket_quantity?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bookings_event_ticket_id_fkey"
            columns: ["event_ticket_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bookings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      event_embeddings: {
        Row: {
          content_text: string
          created_at: string | null
          embedding: string | null
          event_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          content_text: string
          created_at?: string | null
          embedding?: string | null
          event_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          content_text?: string
          created_at?: string | null
          embedding?: string | null
          event_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_embeddings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_embeddings_ai: {
        Row: {
          created_at: string | null
          creator_id: string
          embedding: string | null
          event_description: string | null
          event_title: string
          event_type: string | null
          id: string
          key_topics: string[] | null
          proposal_id: string | null
          target_audience: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          embedding?: string | null
          event_description?: string | null
          event_title: string
          event_type?: string | null
          id?: string
          key_topics?: string[] | null
          proposal_id?: string | null
          target_audience?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          embedding?: string | null
          event_description?: string | null
          event_title?: string
          event_type?: string | null
          id?: string
          key_topics?: string[] | null
          proposal_id?: string | null
          target_audience?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_embeddings_ai_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "ai_event_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      event_favorites: {
        Row: {
          added_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminder_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string
          id: string
          reminder_type: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id: string
          id?: string
          reminder_type: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          id?: string
          reminder_type?: string
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      event_reviews: {
        Row: {
          created_at: string
          event_id: string
          id: string
          rating: number
          review: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          rating: number
          review?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          rating?: number
          review?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tickets: {
        Row: {
          created_at: string | null
          description: string | null
          early_bird_end_date: string | null
          event_id: string
          id: string
          is_active: boolean | null
          name: string
          price: number
          quantity_available: number
          quantity_sold: number
          ticket_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          early_bird_end_date?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          quantity_available?: number
          quantity_sold?: number
          ticket_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          early_bird_end_date?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          quantity_available?: number
          quantity_sold?: number
          ticket_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_tickets_event_id"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          created_at: string | null
          creator_id: string | null
          currency: string | null
          description: string | null
          end_time: string
          event_type: string
          id: string
          image_url: string | null
          is_free: boolean | null
          is_published: boolean | null
          location: string | null
          online_meeting_link: string | null
          price: number | null
          start_time: string
          title: string
          updated_at: string | null
          workplace_id: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          description?: string | null
          end_time: string
          event_type: string
          id?: string
          image_url?: string | null
          is_free?: boolean | null
          is_published?: boolean | null
          location?: string | null
          online_meeting_link?: string | null
          price?: number | null
          start_time: string
          title: string
          updated_at?: string | null
          workplace_id?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          image_url?: string | null
          is_free?: boolean | null
          is_published?: boolean | null
          location?: string | null
          online_meeting_link?: string | null
          price?: number | null
          start_time?: string
          title?: string
          updated_at?: string | null
          workplace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_workplace_id_fkey"
            columns: ["workplace_id"]
            isOneToOne: false
            referencedRelation: "creator_workplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          base_currency: string
          exchange_rate: number
          id: string
          last_updated: string | null
          target_currency: string
        }
        Insert: {
          base_currency?: string
          exchange_rate: number
          id?: string
          last_updated?: string | null
          target_currency: string
        }
        Update: {
          base_currency?: string
          exchange_rate?: number
          id?: string
          last_updated?: string | null
          target_currency?: string
        }
        Relationships: []
      }
      final_exam_answers: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          is_correct: boolean
          order_index: number
          question_id: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "final_exam_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "final_exam_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      final_exam_attempts: {
        Row: {
          answers: Json | null
          attempt_number: number
          completed_at: string | null
          created_at: string | null
          enrollment_id: string
          exam_id: string
          id: string
          passed: boolean
          score: number
          started_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          attempt_number?: number
          completed_at?: string | null
          created_at?: string | null
          enrollment_id: string
          exam_id: string
          id?: string
          passed?: boolean
          score?: number
          started_at?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          attempt_number?: number
          completed_at?: string | null
          created_at?: string | null
          enrollment_id?: string
          exam_id?: string
          id?: string
          passed?: boolean
          score?: number
          started_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "final_exam_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "final_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      final_exam_questions: {
        Row: {
          created_at: string | null
          difficulty_level: string
          exam_id: string
          id: string
          order_index: number
          question: string
          question_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty_level: string
          exam_id: string
          id?: string
          order_index?: number
          question: string
          question_type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty_level?: string
          exam_id?: string
          id?: string
          order_index?: number
          question?: string
          question_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "final_exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "final_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      final_exam_results: {
        Row: {
          attempt_number: number
          completed_at: string
          course_id: string
          created_at: string
          enrollment_id: string
          exam_id: string
          final_grade: number
          id: string
          passed: boolean
          percentage_score: number
          quiz_scores: Json | null
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_number?: number
          completed_at?: string
          course_id: string
          created_at?: string
          enrollment_id: string
          exam_id: string
          final_grade?: number
          id?: string
          passed?: boolean
          percentage_score?: number
          quiz_scores?: Json | null
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string
          course_id?: string
          created_at?: string
          enrollment_id?: string
          exam_id?: string
          final_grade?: number
          id?: string
          passed?: boolean
          percentage_score?: number
          quiz_scores?: Json | null
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "final_exam_results_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_exam_results_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "final_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      final_exams: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          passing_score: number
          time_limit_minutes: number
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          passing_score?: number
          time_limit_minutes?: number
          title?: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          passing_score?: number
          time_limit_minutes?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "final_exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      fundraising_campaigns: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string | null
          creator_id: string | null
          currency: string | null
          description: string | null
          end_date: string | null
          goal_amount: number
          id: string
          start_date: string | null
          status: string | null
          title: string
          updated_at: string | null
          use_of_funds: string | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          goal_amount: number
          id?: string
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          use_of_funds?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          goal_amount?: number
          id?: string
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          use_of_funds?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fundraising_campaigns_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      general_settings: {
        Row: {
          contact_email: string | null
          enable_registration: boolean | null
          id: number
          platform_fee: number | null
          require_email_verification: boolean | null
          site_description: string | null
          site_name: string
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          enable_registration?: boolean | null
          id: number
          platform_fee?: number | null
          require_email_verification?: boolean | null
          site_description?: string | null
          site_name?: string
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          enable_registration?: boolean | null
          id?: number
          platform_fee?: number | null
          require_email_verification?: boolean | null
          site_description?: string | null
          site_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      generated_tickets: {
        Row: {
          booking_id: string | null
          checked_in: boolean | null
          created_at: string
          event_id: string | null
          event_ticket_id: string | null
          generated_at: string
          id: string
          order_id: string | null
          pdf_url: string | null
          qr_code_data: string
          qr_code_url: string | null
          ticket_code: string
          ticket_holder_email: string | null
          ticket_holder_name: string
          ticket_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          checked_in?: boolean | null
          created_at?: string
          event_id?: string | null
          event_ticket_id?: string | null
          generated_at?: string
          id?: string
          order_id?: string | null
          pdf_url?: string | null
          qr_code_data: string
          qr_code_url?: string | null
          ticket_code: string
          ticket_holder_email?: string | null
          ticket_holder_name: string
          ticket_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          checked_in?: boolean | null
          created_at?: string
          event_id?: string | null
          event_ticket_id?: string | null
          generated_at?: string
          id?: string
          order_id?: string | null
          pdf_url?: string | null
          qr_code_data?: string
          qr_code_url?: string | null
          ticket_code?: string
          ticket_holder_email?: string | null
          ticket_holder_name?: string
          ticket_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "event_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_tickets_event_ticket_id_fkey"
            columns: ["event_ticket_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          amount: number
          created_at: string
          currency: string
          expires_at: string
          gift_card_code: string
          id: string
          order_id: string | null
          personal_message: string | null
          recipient_email: string
          recipient_name: string
          sender_email: string
          sender_name: string
          status: string
          updated_at: string
          used_amount: number
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          expires_at?: string
          gift_card_code: string
          id?: string
          order_id?: string | null
          personal_message?: string | null
          recipient_email: string
          recipient_name: string
          sender_email: string
          sender_name: string
          status?: string
          updated_at?: string
          used_amount?: number
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          expires_at?: string
          gift_card_code?: string
          id?: string
          order_id?: string | null
          personal_message?: string | null
          recipient_email?: string
          recipient_name?: string
          sender_email?: string
          sender_name?: string
          status?: string
          updated_at?: string
          used_amount?: number
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_redemptions: {
        Row: {
          amount_used: number
          created_at: string
          gift_card_id: string
          id: string
          order_id: string
          redeemed_by: string
        }
        Insert: {
          amount_used: number
          created_at?: string
          gift_card_id: string
          id?: string
          order_id: string
          redeemed_by: string
        }
        Update: {
          amount_used?: number
          created_at?: string
          gift_card_id?: string
          id?: string
          order_id?: string
          redeemed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_redemptions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          expires_at: string
          gift_code: string
          id: string
          item_id: string
          item_type: string
          order_id: string | null
          personal_message: string | null
          recipient_email: string
          recipient_name: string
          sender_email: string
          sender_name: string
          status: string
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          expires_at?: string
          gift_code: string
          id?: string
          item_id: string
          item_type: string
          order_id?: string | null
          personal_message?: string | null
          recipient_email: string
          recipient_name: string
          sender_email: string
          sender_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          expires_at?: string
          gift_code?: string
          id?: string
          item_id?: string
          item_type?: string
          order_id?: string | null
          personal_message?: string | null
          recipient_email?: string
          recipient_name?: string
          sender_email?: string
          sender_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gifts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      help_center_faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          created_by: string
          id: string
          is_published: boolean
          order_index: number
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          created_by: string
          id?: string
          is_published?: boolean
          order_index?: number
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          is_published?: boolean
          order_index?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      inbox_messages: {
        Row: {
          content: string
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_read: boolean | null
          message_type: string | null
          recipient_id: string
          related_id: string | null
          sender_id: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          recipient_id: string
          related_id?: string | null
          sender_id?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          recipient_id?: string
          related_id?: string | null
          sender_id?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructor_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string
          id: string
          is_verified: boolean | null
          social_links: Json | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_verified?: boolean | null
          social_links?: Json | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_verified?: boolean | null
          social_links?: Json | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_email: string
          applicant_name: string
          applied_at: string
          cover_letter: string | null
          id: string
          job_opening_id: string
          linkedin_profile: string | null
          notes: string | null
          phone_number: string | null
          portfolio_url: string | null
          resume_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          applicant_email: string
          applicant_name: string
          applied_at?: string
          cover_letter?: string | null
          id?: string
          job_opening_id: string
          linkedin_profile?: string | null
          notes?: string | null
          phone_number?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          applicant_email?: string
          applicant_name?: string
          applied_at?: string
          cover_letter?: string | null
          id?: string
          job_opening_id?: string
          linkedin_profile?: string | null
          notes?: string | null
          phone_number?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_opening_id_fkey"
            columns: ["job_opening_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_openings: {
        Row: {
          application_deadline: string | null
          benefits: string | null
          created_at: string
          created_by: string | null
          department: string
          description: string
          employment_type: string
          id: string
          is_active: boolean | null
          location: string
          requirements: string
          responsibilities: string | null
          salary_range: string | null
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          benefits?: string | null
          created_at?: string
          created_by?: string | null
          department: string
          description: string
          employment_type?: string
          id?: string
          is_active?: boolean | null
          location: string
          requirements: string
          responsibilities?: string | null
          salary_range?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          benefits?: string | null
          created_at?: string
          created_by?: string | null
          department?: string
          description?: string
          employment_type?: string
          id?: string
          is_active?: boolean | null
          location?: string
          requirements?: string
          responsibilities?: string | null
          salary_range?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      keynote_speakers: {
        Row: {
          bio: string | null
          created_at: string
          event_id: string
          id: string
          image_url: string | null
          linkedin_url: string | null
          name: string
          order_index: number
          role: string
          speaking_topic: string | null
          title: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          event_id: string
          id?: string
          image_url?: string | null
          linkedin_url?: string | null
          name: string
          order_index?: number
          role?: string
          speaking_topic?: string | null
          title?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          event_id?: string
          id?: string
          image_url?: string | null
          linkedin_url?: string | null
          name?: string
          order_index?: number
          role?: string
          speaking_topic?: string | null
          title?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keynote_speakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_bookmarks: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          timestamp_seconds: number
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          timestamp_seconds: number
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          timestamp_seconds?: number
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_bookmarks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_discussion_likes: {
        Row: {
          created_at: string
          discussion_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discussion_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discussion_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_discussion_likes_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "lesson_discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_discussion_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_discussions: {
        Row: {
          content: string
          created_at: string
          id: string
          is_instructor_reply: boolean | null
          lesson_id: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_instructor_reply?: boolean | null
          lesson_id: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_instructor_reply?: boolean | null
          lesson_id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_discussions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_discussions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "lesson_discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_discussions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completion_date: string | null
          enrollment_id: string
          id: string
          is_completed: boolean | null
          last_position_seconds: number | null
          lesson_id: string
        }
        Insert: {
          completion_date?: string | null
          enrollment_id: string
          id?: string
          is_completed?: boolean | null
          last_position_seconds?: number | null
          lesson_id: string
        }
        Update: {
          completion_date?: string | null
          enrollment_id?: string
          id?: string
          is_completed?: boolean | null
          last_position_seconds?: number | null
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_resources: {
        Row: {
          created_at: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          lesson_id: string
          title: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          lesson_id: string
          title: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          lesson_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_transcripts: {
        Row: {
          created_at: string
          end_time: number
          id: string
          lesson_id: string
          start_time: number
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: number
          id?: string
          lesson_id: string
          start_time: number
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: number
          id?: string
          lesson_id?: string
          start_time?: number
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content: Json | null
          content_type: string | null
          created_at: string | null
          description: string | null
          id: string
          materials_urls: string[] | null
          module_id: string
          order_index: number
          title: string
          transcription_status: string | null
          transcription_updated_at: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          content?: Json | null
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          materials_urls?: string[] | null
          module_id: string
          order_index: number
          title: string
          transcription_status?: string | null
          transcription_updated_at?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          content?: Json | null
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          materials_urls?: string[] | null
          module_id?: string
          order_index?: number
          title?: string
          transcription_status?: string | null
          transcription_updated_at?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      media_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      media_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          created_at: string | null
          duration_minutes: number | null
          episode_number: string | null
          featured: boolean | null
          file_storage_path: string | null
          guest_names: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          language: string | null
          last_updated_at: string | null
          media_type: string | null
          media_url: string | null
          meta_description: string | null
          post_type: string
          published_at: string | null
          reading_time: number | null
          recording_date: string | null
          scheduled_publish_at: string | null
          seo_title: string | null
          series_name: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          updated_by: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          duration_minutes?: number | null
          episode_number?: string | null
          featured?: boolean | null
          file_storage_path?: string | null
          guest_names?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          language?: string | null
          last_updated_at?: string | null
          media_type?: string | null
          media_url?: string | null
          meta_description?: string | null
          post_type: string
          published_at?: string | null
          reading_time?: number | null
          recording_date?: string | null
          scheduled_publish_at?: string | null
          seo_title?: string | null
          series_name?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          duration_minutes?: number | null
          episode_number?: string | null
          featured?: boolean | null
          file_storage_path?: string | null
          guest_names?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          language?: string | null
          last_updated_at?: string | null
          media_type?: string | null
          media_url?: string | null
          meta_description?: string | null
          post_type?: string
          published_at?: string | null
          reading_time?: number | null
          recording_date?: string | null
          scheduled_publish_at?: string | null
          seo_title?: string | null
          series_name?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      media_posts_categories: {
        Row: {
          category_id: string
          post_id: string
        }
        Insert: {
          category_id: string
          post_id: string
        }
        Update: {
          category_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_posts_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "media_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_posts_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "media_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_operators: {
        Row: {
          code: string
          country: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          country: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          country?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_logs: {
        Row: {
          created_at: string
          email: string
          error_message: string | null
          id: string
          newsletter_id: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          newsletter_id: string
          sent_at?: string | null
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          newsletter_id?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_logs_newsletter_id_fkey"
            columns: ["newsletter_id"]
            isOneToOne: false
            referencedRelation: "newsletters"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_templates: {
        Row: {
          body_html_template: string
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          placeholders: Json | null
          subject_template: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          body_html_template: string
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          placeholders?: Json | null
          subject_template: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          body_html_template?: string
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          placeholders?: Json | null
          subject_template?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletters: {
        Row: {
          body_html: string
          created_at: string
          created_by: string
          failed_sends: number | null
          id: string
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string
          successful_sends: number | null
          template_id: string | null
          total_recipients: number | null
          updated_at: string
        }
        Insert: {
          body_html: string
          created_at?: string
          created_by: string
          failed_sends?: number | null
          id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          successful_sends?: number | null
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string
        }
        Update: {
          body_html?: string
          created_at?: string
          created_by?: string
          failed_sends?: number | null
          id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          successful_sends?: number | null
          template_id?: string | null
          total_recipients?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletters_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "newsletter_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          course_recommendations_enabled: boolean
          created_at: string
          email_notifications_enabled: boolean
          event_reminders_enabled: boolean
          id: string
          push_notifications_enabled: boolean
          reminder_timing_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          course_recommendations_enabled?: boolean
          created_at?: string
          email_notifications_enabled?: boolean
          event_reminders_enabled?: boolean
          id?: string
          push_notifications_enabled?: boolean
          reminder_timing_hours?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          course_recommendations_enabled?: boolean
          created_at?: string
          email_notifications_enabled?: boolean
          event_reminders_enabled?: boolean
          id?: string
          push_notifications_enabled?: boolean
          reminder_timing_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          related_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_name: string
          item_type: string
          metadata: Json | null
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_name: string
          item_type: string
          metadata?: Json | null
          order_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_name?: string
          item_type?: string
          metadata?: Json | null
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          applied_gift_card_id: string | null
          card_transaction_id: string | null
          created_at: string | null
          currency: string | null
          deposit_id: string | null
          email: string
          gift_card_discount: number | null
          id: string
          is_gift_purchase: boolean | null
          payment_method: string
          payment_provider_id: string | null
          payment_status: string
          processing_fee: number | null
          receipt_generated_at: string | null
          receipt_url: string | null
          reference_id: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          applied_gift_card_id?: string | null
          card_transaction_id?: string | null
          created_at?: string | null
          currency?: string | null
          deposit_id?: string | null
          email: string
          gift_card_discount?: number | null
          id?: string
          is_gift_purchase?: boolean | null
          payment_method: string
          payment_provider_id?: string | null
          payment_status?: string
          processing_fee?: number | null
          receipt_generated_at?: string | null
          receipt_url?: string | null
          reference_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          applied_gift_card_id?: string | null
          card_transaction_id?: string | null
          created_at?: string | null
          currency?: string | null
          deposit_id?: string | null
          email?: string
          gift_card_discount?: number | null
          id?: string
          is_gift_purchase?: boolean | null
          payment_method?: string
          payment_provider_id?: string | null
          payment_status?: string
          processing_fee?: number | null
          receipt_generated_at?: string | null
          receipt_url?: string | null
          reference_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_applied_gift_card_id_fkey"
            columns: ["applied_gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_card_transaction_id_fkey"
            columns: ["card_transaction_id"]
            isOneToOne: false
            referencedRelation: "card_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          correspondent: string | null
          created_at: string | null
          creator_earning: number | null
          creator_id: string | null
          currency: string
          customer_timestamp: string | null
          deposit_id: string | null
          id: string
          metadata: Json | null
          payer_address: string | null
          payer_type: string | null
          payout_eligible_date: string | null
          phone_number: string | null
          platform_fee_amount: number | null
          provider: string
          provider_transaction_id: string | null
          reference_id: string
          reference_type: string
          statement_description: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          correspondent?: string | null
          created_at?: string | null
          creator_earning?: number | null
          creator_id?: string | null
          currency: string
          customer_timestamp?: string | null
          deposit_id?: string | null
          id?: string
          metadata?: Json | null
          payer_address?: string | null
          payer_type?: string | null
          payout_eligible_date?: string | null
          phone_number?: string | null
          platform_fee_amount?: number | null
          provider?: string
          provider_transaction_id?: string | null
          reference_id: string
          reference_type: string
          statement_description?: string | null
          status: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          correspondent?: string | null
          created_at?: string | null
          creator_earning?: number | null
          creator_id?: string | null
          currency?: string
          customer_timestamp?: string | null
          deposit_id?: string | null
          id?: string
          metadata?: Json | null
          payer_address?: string | null
          payer_type?: string | null
          payout_eligible_date?: string | null
          phone_number?: string | null
          platform_fee_amount?: number | null
          provider?: string
          provider_transaction_id?: string | null
          reference_id?: string
          reference_type?: string
          statement_description?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          emoji_reactions: Json | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          emoji_reactions?: Json | null
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          emoji_reactions?: Json | null
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          like_type: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          like_type?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          like_type?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_storage_path: string | null
          avatar_url: string | null
          bank_account_details: Json | null
          beams_authenticated: boolean | null
          beams_authenticated_at: string | null
          bio: string | null
          created_at: string | null
          creator_enabled_at: string | null
          deactivated_at: string | null
          deactivation_reason: string | null
          default_payout_method: string | null
          email_verified: boolean | null
          expo_push_token: string | null
          full_name: string | null
          id: string
          is_creator: boolean | null
          last_activity: string | null
          mobile_money_country: string | null
          mobile_money_details: Json | null
          mobile_money_number: string | null
          mobile_money_operator: string | null
          newsletter_subscribed: boolean | null
          otp_required: boolean | null
          otp_verified: boolean | null
          payout_method: string | null
          push_interests: string[] | null
          push_last_subscribed: string | null
          push_last_unsubscribed: string | null
          push_last_updated: string | null
          push_notifications_enabled: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: string | null
          stripe_connect_account_id: string | null
          stripe_connect_id: string | null
          stripe_onboarding_completed: boolean | null
          suspension_ends_at: string | null
          suspension_reason: string | null
          suspension_started_at: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_storage_path?: string | null
          avatar_url?: string | null
          bank_account_details?: Json | null
          beams_authenticated?: boolean | null
          beams_authenticated_at?: string | null
          bio?: string | null
          created_at?: string | null
          creator_enabled_at?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          default_payout_method?: string | null
          email_verified?: boolean | null
          expo_push_token?: string | null
          full_name?: string | null
          id: string
          is_creator?: boolean | null
          last_activity?: string | null
          mobile_money_country?: string | null
          mobile_money_details?: Json | null
          mobile_money_number?: string | null
          mobile_money_operator?: string | null
          newsletter_subscribed?: boolean | null
          otp_required?: boolean | null
          otp_verified?: boolean | null
          payout_method?: string | null
          push_interests?: string[] | null
          push_last_subscribed?: string | null
          push_last_unsubscribed?: string | null
          push_last_updated?: string | null
          push_notifications_enabled?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_id?: string | null
          stripe_onboarding_completed?: boolean | null
          suspension_ends_at?: string | null
          suspension_reason?: string | null
          suspension_started_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_storage_path?: string | null
          avatar_url?: string | null
          bank_account_details?: Json | null
          beams_authenticated?: boolean | null
          beams_authenticated_at?: string | null
          bio?: string | null
          created_at?: string | null
          creator_enabled_at?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          default_payout_method?: string | null
          email_verified?: boolean | null
          expo_push_token?: string | null
          full_name?: string | null
          id?: string
          is_creator?: boolean | null
          last_activity?: string | null
          mobile_money_country?: string | null
          mobile_money_details?: Json | null
          mobile_money_number?: string | null
          mobile_money_operator?: string | null
          newsletter_subscribed?: boolean | null
          otp_required?: boolean | null
          otp_verified?: boolean | null
          payout_method?: string | null
          push_interests?: string[] | null
          push_last_subscribed?: string | null
          push_last_unsubscribed?: string | null
          push_last_updated?: string | null
          push_notifications_enabled?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_id?: string | null
          stripe_onboarding_completed?: boolean | null
          suspension_ends_at?: string | null
          suspension_reason?: string | null
          suspension_started_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          creator_id: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          item_id: string | null
          item_type: string | null
          max_uses: number | null
          min_order_amount: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          creator_id?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          item_id?: string | null
          item_type?: string | null
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          creator_id?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          item_id?: string | null
          item_type?: string | null
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          beams_token: string | null
          beams_token_expires_at: string | null
          created_at: string
          device_id: string
          id: string
          interests: string[] | null
          is_active: boolean
          platform: string | null
          provider: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          beams_token?: string | null
          beams_token_expires_at?: string | null
          created_at?: string
          device_id: string
          id?: string
          interests?: string[] | null
          is_active?: boolean
          platform?: string | null
          provider?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          beams_token?: string | null
          beams_token_expires_at?: string | null
          created_at?: string
          device_id?: string
          id?: string
          interests?: string[] | null
          is_active?: boolean
          platform?: string | null
          provider?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          is_correct: boolean
          order_index: number
          question_id: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          is_correct?: boolean
          order_index: number
          question_id: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          attempt_number: number
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          passed?: boolean
          quiz_id: string
          score?: number
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string | null
          explanation: string | null
          id: string
          order_index: number
          question: string
          quiz_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          explanation?: string | null
          id?: string
          order_index: number
          question: string
          quiz_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          explanation?: string | null
          id?: string
          order_index?: number
          question?: string
          quiz_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          lesson_id: string | null
          module_id: string | null
          passing_score: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          lesson_id?: string | null
          module_id?: string | null
          passing_score?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          lesson_id?: string | null
          module_id?: string | null
          passing_score?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          mobile_operator: string | null
          payment_amount: number | null
          payment_currency: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string
          phone_number: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          mobile_operator?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status: string
          phone_number?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          mobile_operator?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string
          phone_number?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      speaking_appearances: {
        Row: {
          appearance_type: string
          created_at: string
          description: string
          event_date: string
          event_name: string
          id: string
          image_url: string | null
          location: string
          media_link: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          appearance_type: string
          created_at?: string
          description: string
          event_date: string
          event_name: string
          id?: string
          image_url?: string | null
          location: string
          media_link?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          appearance_type?: string
          created_at?: string
          description?: string
          event_date?: string
          event_name?: string
          id?: string
          image_url?: string | null
          location?: string
          media_link?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      speaking_bookings: {
        Row: {
          created_at: string
          description: string | null
          email: string
          event_date: string
          event_type: string
          id: string
          name: string
          organization: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          email: string
          event_date: string
          event_type: string
          id?: string
          name: string
          organization: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string
          event_date?: string
          event_type?: string
          id?: string
          name?: string
          organization?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      speaking_topics: {
        Row: {
          created_at: string
          description: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string | null
          data: Json | null
          event_type: string
          id: string
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          event_type: string
          id?: string
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          event_type?: string
          id?: string
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          amount: number
          amount_paid: number | null
          created_at: string | null
          currency: string | null
          deposit_id: string | null
          description: string | null
          id: string
          metadata: Json | null
          payment_status: string | null
          reference_id: string | null
          token_price: number | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          amount_paid?: number | null
          created_at?: string | null
          currency?: string | null
          deposit_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_status?: string | null
          reference_id?: string | null
          token_price?: number | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          amount_paid?: number | null
          created_at?: string | null
          currency?: string | null
          deposit_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_status?: string | null
          reference_id?: string | null
          token_price?: number | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      top_up_config: {
        Row: {
          created_at: string | null
          default_amounts: number[] | null
          id: string
          max_amount: number | null
          min_amount: number | null
          token_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_amounts?: number[] | null
          id?: string
          max_amount?: number | null
          min_amount?: number | null
          token_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_amounts?: number[] | null
          id?: string
          max_amount?: number | null
          min_amount?: number | null
          token_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string | null
          id: string
          max_progress: number
          progress: number
          unlocked_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string | null
          id?: string
          max_progress?: number
          progress?: number
          unlocked_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string | null
          id?: string
          max_progress?: number
          progress?: number
          unlocked_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_currency_preferences: {
        Row: {
          country_code: string | null
          created_at: string | null
          default_currency: string
          detected_by_ip: boolean | null
          device_currency: string | null
          id: string
          ip_address: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          default_currency?: string
          detected_by_ip?: boolean | null
          device_currency?: string | null
          id?: string
          ip_address?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          default_currency?: string
          detected_by_ip?: boolean | null
          device_currency?: string | null
          id?: string
          ip_address?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_language_preferences: {
        Row: {
          created_at: string | null
          language_code: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          language_code?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          language_code?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_media_preferences: {
        Row: {
          auto_download: boolean | null
          created_at: string | null
          reduce_data_usage: boolean | null
          sound_effects: boolean | null
          updated_at: string | null
          user_id: string
          video_quality: string | null
        }
        Insert: {
          auto_download?: boolean | null
          created_at?: string | null
          reduce_data_usage?: boolean | null
          sound_effects?: boolean | null
          updated_at?: string | null
          user_id: string
          video_quality?: string | null
        }
        Update: {
          auto_download?: boolean | null
          created_at?: string | null
          reduce_data_usage?: boolean | null
          sound_effects?: boolean | null
          updated_at?: string | null
          user_id?: string
          video_quality?: string | null
        }
        Relationships: []
      }
      user_online_status: {
        Row: {
          id: string
          is_online: boolean | null
          last_seen: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_otp_verifications: {
        Row: {
          attempts: number | null
          created_at: string
          expires_at: string
          id: string
          max_attempts: number | null
          otp_code: string
          user_id: string
          verification_type: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          max_attempts?: number | null
          otp_code: string
          user_id: string
          verification_type: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          max_attempts?: number | null
          otp_code?: string
          user_id?: string
          verification_type?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tokens: {
        Row: {
          balance: number | null
          created_at: string | null
          free_tokens_available: number | null
          free_tokens_used: number | null
          has_used_free_trial: boolean | null
          id: string
          total_purchased: number | null
          total_used: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          free_tokens_available?: number | null
          free_tokens_used?: number | null
          has_used_free_trial?: boolean | null
          id?: string
          total_purchased?: number | null
          total_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          free_tokens_available?: number | null
          free_tokens_used?: number | null
          has_used_free_trial?: boolean | null
          id?: string
          total_purchased?: number | null
          total_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      video_metadata: {
        Row: {
          content_type: string
          created_at: string
          duration_seconds: number | null
          file_size: number
          filename: string
          id: string
          lesson_id: string
          original_filename: string
          storage_path: string
          updated_at: string
          wasabi_url: string
        }
        Insert: {
          content_type: string
          created_at?: string
          duration_seconds?: number | null
          file_size: number
          filename: string
          id?: string
          lesson_id: string
          original_filename: string
          storage_path: string
          updated_at?: string
          wasabi_url: string
        }
        Update: {
          content_type?: string
          created_at?: string
          duration_seconds?: number | null
          file_size?: number
          filename?: string
          id?: string
          lesson_id?: string
          original_filename?: string
          storage_path?: string
          updated_at?: string
          wasabi_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_metadata_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          added_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      workplace_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["workplace_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at: string
          workplace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["workplace_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at?: string
          workplace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["workplace_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
          workplace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workplace_invitations_workplace_id_fkey"
            columns: ["workplace_id"]
            isOneToOne: false
            referencedRelation: "creator_workplaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      event_embeddings_ai_with_users: {
        Row: {
          created_at: string | null
          creator_email: string | null
          creator_id: string | null
          embedding: string | null
          event_description: string | null
          event_title: string | null
          event_type: string | null
          id: string | null
          key_topics: string[] | null
          proposal_id: string | null
          target_audience: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_embeddings_ai_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "ai_event_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress_with_user: {
        Row: {
          completion_date: string | null
          course_id: string | null
          enrollment_id: string | null
          id: string | null
          is_completed: boolean | null
          last_position_seconds: number | null
          lesson_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      broadcast_message_to_all_users: {
        Args: {
          p_admin_id: string
          p_content: string
          p_message_type?: string
          p_priority?: string
          p_subject: string
        }
        Returns: string
      }
      calculate_creator_balance: {
        Args: { creator_user_id: string }
        Returns: {
          available_balance: number
          pending_balance: number
          total_earnings: number
          total_platform_fees: number
        }[]
      }
      calculate_creator_earnings: {
        Args: { creator_user_id: string }
        Returns: {
          available_balance: number
          course_revenue: number
          event_revenue: number
          pending_balance: number
          total_earnings: number
          total_platform_fees: number
        }[]
      }
      can_edit_workplace_content: {
        Args: { workplace_uuid: string }
        Returns: boolean
      }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      cleanup_expired_proposals: { Args: never; Returns: undefined }
      cleanup_old_event_embeddings_ai: {
        Args: { days_old?: number }
        Returns: number
      }
      count_bookings_by_event: {
        Args: never
        Returns: {
          count: string
          event_id: string
        }[]
      }
      count_registrations_by_event: {
        Args: never
        Returns: {
          count: string
          event_id: string
        }[]
      }
      creator_owns_order_content: {
        Args: { creator_uuid: string; order_uuid: string }
        Returns: boolean
      }
      detect_currency_by_country: {
        Args: { country_code: string }
        Returns: string
      }
      generate_booking_code: { Args: never; Returns: string }
      generate_gift_card_code: { Args: never; Returns: string }
      generate_gift_code: { Args: never; Returns: string }
      generate_ticket_code: { Args: never; Returns: string }
      generate_ticket_number: { Args: never; Returns: string }
      generate_unique_ticket_code: { Args: never; Returns: string }
      get_available_tickets: { Args: { ticket_id: string }; Returns: number }
      get_current_exchange_rates: {
        Args: never
        Returns: {
          exchange_rate: number
          target_currency: string
        }[]
      }
      get_current_user_email: { Args: never; Returns: string }
      get_event_embeddings_ai_stats: {
        Args: { user_id?: string }
        Returns: {
          event_types: string[]
          newest_embedding: string
          oldest_embedding: string
          total_embeddings: number
          user_embeddings: number
        }[]
      }
      get_exchange_rate: {
        Args: { from_currency: string; to_currency: string }
        Returns: number
      }
      get_user_currency: { Args: { user_uuid: string }; Returns: string }
      get_user_emails: {
        Args: { user_ids: string[] }
        Returns: {
          created_at: string
          email: string
          id: string
        }[]
      }
      get_user_workplace_ids: { Args: never; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_creator_content_owner: {
        Args: {
          creator_uuid: string
          item_id_param: string
          item_type_param: string
        }
        Returns: boolean
      }
      is_workplace_member: {
        Args: { workplace_uuid: string }
        Returns: boolean
      }
      is_workspace_member_func: {
        Args: { workspace_uuid: string }
        Returns: boolean
      }
      is_workspace_owner: { Args: { workspace_uuid: string }; Returns: boolean }
      match_documents: {
        Args: {
          filter_course_id?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_event_embeddings_ai: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          event_description: string
          event_title: string
          event_type: string
          id: string
          key_topics: string[]
          similarity: number
          target_audience: string
        }[]
      }
      process_payment_success: {
        Args: {
          p_order_id: string
          p_payment_intent_id?: string
          p_session_id?: string
        }
        Returns: boolean
      }
      search_courses_by_embedding:
        | {
            Args: {
              embedding_vector: string
              match_count?: number
              match_threshold?: number
              query_embedding_model?: string
            }
            Returns: {
              description: string
              id: number
              similarity: number
              title: string
            }[]
          }
        | {
            Args: {
              match_count: number
              match_threshold: number
              query_embedding: string
            }
            Returns: {
              category: string
              creator_id: string
              difficulty_level: string
              duration_minutes: number
              id: string
              is_free: boolean
              price: number
              similarity: number
              thumbnail_url: string
              title: string
            }[]
          }
      search_events_by_embedding: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          creator_id: string
          end_time: string
          event_type: string
          id: string
          image_url: string
          is_free: boolean
          location: string
          price: number
          similarity: number
          start_time: string
          title: string
        }[]
      }
      update_newsletter_stats: {
        Args: { newsletter_id: string }
        Returns: undefined
      }
      update_ticket_inventory: {
        Args: { p_quantity: number; p_ticket_id: string }
        Returns: boolean
      }
      update_user_currency: {
        Args: {
          country_code?: string
          currency_code: string
          user_uuid: string
        }
        Returns: undefined
      }
      user_needs_otp_verification: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      validate_creator_students: {
        Args: { creator_id: string; student_ids: string[] }
        Returns: {
          student_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "creator"
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      user_role: "user" | "admin"
      workplace_role: "owner" | "editor" | "viewer"
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
      app_role: ["admin", "user", "creator"],
      invitation_status: ["pending", "accepted", "expired", "cancelled"],
      user_role: ["user", "admin"],
      workplace_role: ["owner", "editor", "viewer"],
    },
  },
} as const
