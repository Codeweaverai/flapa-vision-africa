export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      certificates: {
        Row: {
          enrollment_id: string
          id: string
          issue_date: string | null
          pdf_url: string | null
          verification_code: string
        }
        Insert: {
          enrollment_id: string
          id?: string
          issue_date?: string | null
          pdf_url?: string | null
          verification_code: string
        }
        Update: {
          enrollment_id?: string
          id?: string
          issue_date?: string | null
          pdf_url?: string | null
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
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
      community_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      course_enrollments: {
        Row: {
          completion_date: string | null
          course_id: string
          enrollment_date: string | null
          id: string
          is_completed: boolean | null
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
        }
        Relationships: []
      }
      creator_payouts: {
        Row: {
          amount: number
          created_at: string
          creator_id: string
          currency: string
          destination: string
          id: string
          method: string
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          creator_id: string
          currency?: string
          destination: string
          id?: string
          method: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          creator_id?: string
          currency?: string
          destination?: string
          id?: string
          method?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_bookings: {
        Row: {
          booking_date: string | null
          created_at: string | null
          event_id: string
          id: string
          mobile_operator: string | null
          payment_amount: number | null
          payment_currency: string | null
          payment_id: string | null
          payment_status: string | null
          phone_number: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_date?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          mobile_operator?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_status?: string | null
          phone_number?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_date?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          mobile_operator?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_id?: string | null
          payment_status?: string | null
          phone_number?: string | null
          status?: string | null
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
          location: string | null
          online_meeting_link: string | null
          price: number | null
          start_time: string
          title: string
          updated_at: string | null
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
          location?: string | null
          online_meeting_link?: string | null
          price?: number | null
          start_time: string
          title: string
          updated_at?: string | null
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
          location?: string | null
          online_meeting_link?: string | null
          price?: number | null
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
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
          id: string
          image_url: string | null
          is_published: boolean | null
          media_url: string | null
          post_type: string
          published_at: string | null
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          media_url?: string | null
          post_type: string
          published_at?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          media_url?: string | null
          post_type?: string
          published_at?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
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
      payment_transactions: {
        Row: {
          amount: number
          correspondent: string | null
          created_at: string | null
          currency: string
          customer_timestamp: string | null
          deposit_id: string | null
          id: string
          metadata: Json | null
          payer_address: string | null
          payer_type: string | null
          phone_number: string | null
          provider: string
          provider_transaction_id: string | null
          reference_id: string
          reference_type: string
          statement_description: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          correspondent?: string | null
          created_at?: string | null
          currency: string
          customer_timestamp?: string | null
          deposit_id?: string | null
          id?: string
          metadata?: Json | null
          payer_address?: string | null
          payer_type?: string | null
          phone_number?: string | null
          provider?: string
          provider_transaction_id?: string | null
          reference_id: string
          reference_type: string
          statement_description?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          correspondent?: string | null
          created_at?: string | null
          currency?: string
          customer_timestamp?: string | null
          deposit_id?: string | null
          id?: string
          metadata?: Json | null
          payer_address?: string | null
          payer_type?: string | null
          phone_number?: string | null
          provider?: string
          provider_transaction_id?: string | null
          reference_id?: string
          reference_type?: string
          statement_description?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_account_details: Json | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_creator: boolean | null
          mobile_money_number: string | null
          payout_method: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          stripe_connect_id: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bank_account_details?: Json | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_creator?: boolean | null
          mobile_money_number?: string | null
          payout_method?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          stripe_connect_id?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bank_account_details?: Json | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_creator?: boolean | null
          mobile_money_number?: string | null
          payout_method?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          stripe_connect_id?: string | null
          updated_at?: string | null
          username?: string | null
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
      quiz_questions: {
        Row: {
          created_at: string | null
          id: string
          order_index: number
          question: string
          quiz_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_index: number
          question: string
          quiz_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_bookings_by_event: {
        Args: Record<PropertyKey, never>
        Returns: {
          event_id: string
          count: string
        }[]
      }
      count_registrations_by_event: {
        Args: Record<PropertyKey, never>
        Returns: {
          event_id: string
          count: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: "user" | "admin"
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
  public: {
    Enums: {
      user_role: ["user", "admin"],
    },
  },
} as const
