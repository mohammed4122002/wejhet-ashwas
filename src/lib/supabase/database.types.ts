/**
 * أنواع قاعدة البيانات — مكتوبة يدوياً وتم التحقق من تطابقها مع المخطط الحيّ
 * المطبَّق على مشروع Supabase (jtcrobllzrrvsodmtspp) عبر `generate_typescript_types`.
 *
 * نُبقيها يدوية عن قصد لأنها أدقّ من المولّدة آلياً: الأعمدة النصية ذات قيود CHECK
 * (track, reward_system, status, task_type, skill_type, difficulty, source)
 * مُمثَّلة هنا كأنواع اتحاد (union) صارمة بدل `string` عام — يستفيد منها كود الواجهة.
 * عند أي تغيير بالمخطط لاحقاً، حدّث هذا الملف مقابله.
 */

export type Track = "scientific" | "literary";
export type SubjectTrack = "scientific" | "literary" | "shared";
export type RewardSystem =
  | "palestine_map"
  | "star_constellations"
  | "city_builder"
  | "garden_tree"
  | "minimal";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskType = "study" | "review";
export type SlotType = "study" | "fixed";
export type SkillType = "understanding" | "application" | "analysis";
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionSource = "past_exam" | "practice";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          track: Track;
          reward_system: RewardSystem;
          auto_schedule_apply: boolean;
          created_at: string | null;
          display_name: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          track: Track;
          reward_system?: RewardSystem;
          auto_schedule_apply?: boolean;
          created_at?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          track: SubjectTrack;
          name_ar: string;
          slug: string;
          order_index: number | null;
        };
        Insert: {
          id?: string;
          track: SubjectTrack;
          name_ar: string;
          slug: string;
          order_index?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["subjects"]["Insert"]>;
        Relationships: [];
      };
      units: {
        Row: {
          id: string;
          subject_id: string | null;
          name_ar: string;
          order_index: number | null;
        };
        Insert: {
          id?: string;
          subject_id?: string | null;
          name_ar: string;
          order_index?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["units"]["Insert"]>;
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          unit_id: string | null;
          name_ar: string;
          order_index: number | null;
        };
        Insert: {
          id?: string;
          unit_id?: string | null;
          name_ar: string;
          order_index?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["lessons"]["Insert"]>;
        Relationships: [];
      };
      schedule_slots: {
        Row: {
          id: string;
          user_id: string | null;
          day_of_week: number;
          start_time: string;
          end_time: string;
          title: string;
          subject_id: string | null;
          is_recurring: boolean | null;
          slot_type: SlotType;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          day_of_week: number;
          start_time: string;
          end_time: string;
          title: string;
          subject_id?: string | null;
          is_recurring?: boolean | null;
          slot_type?: SlotType;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["schedule_slots"]["Insert"]
        >;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string | null;
          schedule_slot_id: string | null;
          lesson_id: string | null;
          subject_id: string | null;
          title: string;
          task_date: string;
          task_type: TaskType;
          status: TaskStatus;
          created_at: string | null;
          completed_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          schedule_slot_id?: string | null;
          lesson_id?: string | null;
          subject_id?: string | null;
          title: string;
          task_date: string;
          task_type?: TaskType;
          status?: TaskStatus;
          created_at?: string | null;
          completed_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [];
      };
      exam_schedule: {
        Row: {
          id: string;
          user_id: string | null;
          subject_id: string | null;
          exam_date: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          subject_id?: string | null;
          exam_date: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["exam_schedule"]["Insert"]
        >;
        Relationships: [];
      };
      pomodoro_sessions: {
        Row: {
          id: string;
          task_id: string | null;
          user_id: string | null;
          duration_minutes: number;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          task_id?: string | null;
          user_id?: string | null;
          duration_minutes: number;
          started_at: string;
          ended_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["pomodoro_sessions"]["Insert"]
        >;
        Relationships: [];
      };
      question_bank_items: {
        Row: {
          id: string;
          subject_id: string | null;
          unit_id: string | null;
          lesson_id: string | null;
          skill_type: SkillType | null;
          difficulty: Difficulty | null;
          source: QuestionSource | null;
          exam_year: number | null;
          question_text: string;
          choices: Json;
          correct_answer: string;
          explanation_text: string;
          explanation_video_url: string | null;
        };
        Insert: {
          id?: string;
          subject_id?: string | null;
          unit_id?: string | null;
          lesson_id?: string | null;
          skill_type?: SkillType | null;
          difficulty?: Difficulty | null;
          source?: QuestionSource | null;
          exam_year?: number | null;
          question_text: string;
          choices: Json;
          correct_answer: string;
          explanation_text: string;
          explanation_video_url?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["question_bank_items"]["Insert"]
        >;
        Relationships: [];
      };
      question_attempts: {
        Row: {
          id: string;
          user_id: string | null;
          question_id: string | null;
          is_correct: boolean;
          time_spent_seconds: number | null;
          answered_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          question_id?: string | null;
          is_correct: boolean;
          time_spent_seconds?: number | null;
          answered_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["question_attempts"]["Insert"]
        >;
        Relationships: [];
      };
      reward_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: string;
          ref_id: string | null;
          unlocked_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          ref_id?: string | null;
          unlocked_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["reward_events"]["Insert"]
        >;
        Relationships: [];
      };
      reminder_settings: {
        Row: {
          user_id: string;
          study_reminders: boolean | null;
          motivational_reminders: boolean | null;
          religious_reminders: boolean | null;
        };
        Insert: {
          user_id: string;
          study_reminders?: boolean | null;
          motivational_reminders?: boolean | null;
          religious_reminders?: boolean | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["reminder_settings"]["Insert"]
        >;
        Relationships: [];
      };
      doubt_box_entries: {
        Row: {
          id: string;
          user_id: string | null;
          task_id: string | null;
          subject_id: string | null;
          lesson_id: string | null;
          question_text: string;
          is_resolved: boolean;
          resolved_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          task_id?: string | null;
          subject_id?: string | null;
          lesson_id?: string | null;
          question_text: string;
          is_resolved?: boolean;
          resolved_at?: string | null;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["doubt_box_entries"]["Insert"]
        >;
        Relationships: [];
      };
      challenges: {
        Row: {
          id: string;
          creator_id: string | null;
          name: string;
          invite_code: string;
          is_private: boolean | null;
          start_date: string | null;
          end_date: string | null;
          created_at: string | null;
          goal: string | null;
        };
        Insert: {
          id?: string;
          creator_id?: string | null;
          name: string;
          invite_code?: string;
          is_private?: boolean | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string | null;
          goal?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["challenges"]["Insert"]>;
        Relationships: [];
      };
      challenge_participants: {
        Row: {
          challenge_id: string;
          user_id: string;
          display_alias: string | null;
          joined_at: string | null;
          progress: number;
          updated_at: string | null;
        };
        Insert: {
          challenge_id: string;
          user_id: string;
          display_alias?: string | null;
          joined_at?: string | null;
          progress?: number;
          updated_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["challenge_participants"]["Insert"]
        >;
        Relationships: [];
      };
      leaderboard_opt_in: {
        Row: {
          user_id: string;
          display_alias: string;
          is_visible: boolean;
          commitment_score: number;
          streak_days: number;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          display_alias: string;
          is_visible?: boolean;
          commitment_score?: number;
          streak_days?: number;
          updated_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["leaderboard_opt_in"]["Insert"]
        >;
        Relationships: [];
      };
      mock_exams: {
        Row: {
          id: string;
          subject_id: string | null;
          title: string;
          duration_minutes: number;
          question_ids: string[];
        };
        Insert: {
          id?: string;
          subject_id?: string | null;
          title: string;
          duration_minutes: number;
          question_ids: string[];
        };
        Update: Partial<Database["public"]["Tables"]["mock_exams"]["Insert"]>;
        Relationships: [];
      };
      mock_exam_attempts: {
        Row: {
          id: string;
          user_id: string | null;
          mock_exam_id: string | null;
          started_at: string;
          submitted_at: string | null;
          answers: Json | null;
          score_percent: number | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          mock_exam_id?: string | null;
          started_at?: string;
          submitted_at?: string | null;
          answers?: Json | null;
          score_percent?: number | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["mock_exam_attempts"]["Insert"]
        >;
        Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          subject: string | null;
          file_type: string;
          source_type: string;
          file_url: string;
          file_size: number | null;
          tags: string[] | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          subject?: string | null;
          file_type: string;
          source_type: string;
          file_url: string;
          file_size?: number | null;
          tags?: string[] | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["materials"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      heatmap_unit_progress: {
        Row: {
          user_id: string | null;
          subject_id: string | null;
          unit_id: string | null;
          unit_name: string | null;
          total_lessons: number | null;
          mastered_lessons: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      join_challenge: {
        Args: { code: string; alias: string };
        Returns: string | null;
      };
      is_member_of: {
        Args: { cid: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
