export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      entries: {
        Row: {
          amount: number;
          created_at: string;
          direction: string;
          friend_id: string;
          group_id: string | null;
          id: string;
          kind: string;
          note: string;
          owner_id: string;
          settled: boolean;
          status: string;
          proof_url: string | null;
          dispute_reason: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          direction: string;
          friend_id: string;
          group_id?: string | null;
          id?: string;
          kind: string;
          note?: string;
          owner_id?: string;
          settled?: boolean;
          status?: string;
          proof_url?: string | null;
          dispute_reason?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          direction?: string;
          friend_id?: string;
          group_id?: string | null;
          id?: string;
          kind?: string;
          note?: string;
          owner_id?: string;
          settled?: boolean;
          status?: string;
          proof_url?: string | null;
          dispute_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "entries_friend_id_fkey";
            columns: ["friend_id"];
            isOneToOne: false;
            referencedRelation: "friends";
            referencedColumns: ["id"];
          },
        ];
      };
      friends: {
        Row: {
          created_at: string;
          emoji: string;
          id: string;
          name: string;
          owner_id: string;
          phone: string;
          friend_user_id: string | null;
        };
        Insert: {
          created_at?: string;
          emoji?: string;
          id?: string;
          name: string;
          owner_id?: string;
          phone?: string;
          friend_user_id?: string | null;
        };
        Update: {
          created_at?: string;
          emoji?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          phone?: string;
          friend_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "friends_friend_user_id_fkey";
            columns: ["friend_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      price_items: {
        Row: {
          category: string;
          created_at: string;
          emoji: string;
          hidden: boolean;
          id: string;
          item_key: string;
          name: string;
          owner_id: string;
          price: number;
        };
        Insert: {
          category?: string;
          created_at?: string;
          emoji?: string;
          hidden?: boolean;
          id?: string;
          item_key: string;
          name: string;
          owner_id?: string;
          price: number;
        };
        Update: {
          category?: string;
          created_at?: string;
          emoji?: string;
          hidden?: boolean;
          id?: string;
          item_key?: string;
          name?: string;
          owner_id?: string;
          price?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          username: string;
          upi_id: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          id: string;
          username: string;
          upi_id?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          username?: string;
          upi_id?: string;
        };
        Relationships: [];
      };
      notices: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          type: string;
          message: string;
          sticker: string | null;
          amount: number | null;
          entry_id: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          type: string;
          message?: string;
          sticker?: string | null;
          amount?: number | null;
          entry_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          type?: string;
          message?: string;
          sticker?: string | null;
          amount?: number | null;
          entry_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notices_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notices_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notices_entry_id_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "entries";
            referencedColumns: ["id"];
          },
        ];
      };
      galla: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      galla_members: {
        Row: {
          galla_id: string;
          user_id: string;
        };
        Insert: {
          galla_id: string;
          user_id: string;
        };
        Update: {
          galla_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "galla_members_galla_id_fkey";
            columns: ["galla_id"];
            isOneToOne: false;
            referencedRelation: "galla";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "galla_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      galla_entries: {
        Row: {
          id: string;
          galla_id: string;
          user_id: string;
          amount: number;
          note: string | null;
          type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          galla_id: string;
          user_id?: string;
          amount: number;
          note?: string | null;
          type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          galla_id?: string;
          user_id?: string;
          amount?: number;
          note?: string | null;
          type?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "galla_entries_galla_id_fkey";
            columns: ["galla_id"];
            isOneToOne: false;
            referencedRelation: "galla";
            referencedColumns: ["id"];
          },
        ];
      };
      chores: {
        Row: {
          id: string;
          owner_id: string;
          label: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          label: string;
          emoji?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          label?: string;
          emoji?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
