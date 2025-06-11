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
      ai_chat_history: {
        Row: {
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
          last_lesson_completed: string | null
          progress_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          last_lesson_completed?: string | null
          progress_percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
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
          minimum_threshold_met: boolean | null
          provider_payout_id: string | null
          status: string
          stripe_payout_id: string | null
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
          minimum_threshold_met?: boolean | null
          provider_payout_id?: string | null
          status?: string
          stripe_payout_id?: string | null
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
          minimum_threshold_met?: boolean | null
          provider_payout_id?: string | null
          status?: string
          stripe_payout_id?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
          created_at: string | null
          event_id: string | null
          event_ticket_id: string | null
          generated_at: string | null
          id: string
          order_id: string | null
          pdf_storage_path: string | null
          pdf_url: string | null
          qr_code_data: string
          ticket_code: string
          ticket_holder_email: string | null
          ticket_holder_name: string
          ticket_status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          event_id?: string | null
          event_ticket_id?: string | null
          generated_at?: string | null
          id?: string
          order_id?: string | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          qr_code_data: string
          ticket_code: string
          ticket_holder_email?: string | null
          ticket_holder_name: string
          ticket_status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          event_id?: string | null
          event_ticket_id?: string | null
          generated_at?: string | null
          id?: string
          order_id?: string | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          qr_code_data?: string
          ticket_code?: string
          ticket_holder_email?: string | null
          ticket_holder_name?: string
          ticket_status?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      inbox_messages: {
        Row: {
          content: string
          created_at: string
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
          speaking_topic: string | null
          title: string | null
          twitter_url: string | null
          updated_at: string
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
          speaking_topic?: string | null
          title?: string | null
          twitter_url?: string | null
          updated_at?: string
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
          speaking_topic?: string | null
          title?: string | null
          twitter_url?: string | null
          updated_at?: string
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
        ]
      }
      lesson_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_id: string
          timestamp_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lesson_id: string
          timestamp_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string
          timestamp_seconds?: number | null
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
          id: string
          language: string
          lesson_id: string
          transcript_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          lesson_id: string
          transcript_data?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          lesson_id?: string
          transcript_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_transcripts_lesson_id_fkey"
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
          created_at: string | null
          currency: string | null
          email: string
          id: string
          payment_method: string
          payment_provider_id: string | null
          payment_status: string
          receipt_generated_at: string | null
          receipt_url: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          email: string
          id?: string
          payment_method: string
          payment_provider_id?: string | null
          payment_status?: string
          receipt_generated_at?: string | null
          receipt_url?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          email?: string
          id?: string
          payment_method?: string
          payment_provider_id?: string | null
          payment_status?: string
          receipt_generated_at?: string | null
          receipt_url?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          bio: string | null
          created_at: string | null
          creator_enabled_at: string | null
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
          avatar_storage_path?: string | null
          avatar_url?: string | null
          bank_account_details?: Json | null
          bio?: string | null
          created_at?: string | null
          creator_enabled_at?: string | null
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
          avatar_storage_path?: string | null
          avatar_url?: string | null
          bank_account_details?: Json | null
          bio?: string | null
          created_at?: string | null
          creator_enabled_at?: string | null
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
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          valid_from?: string | null
          valid_until?: string | null
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
      calculate_creator_balance: {
        Args: { creator_user_id: string }
        Returns: {
          available_balance: number
          pending_balance: number
          total_earnings: number
          total_platform_fees: number
        }[]
      }
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
      generate_ticket_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      process_payment_success: {
        Args: {
          p_order_id: string
          p_payment_intent_id?: string
          p_session_id?: string
        }
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
