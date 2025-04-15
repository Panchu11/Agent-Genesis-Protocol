export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string
          avatar_url: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email: string
          avatar_url?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string
          avatar_url?: string | null
          updated_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      agents: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          archetype: string | null
          personality: Json
          capabilities: Json
          knowledge_base_ids: string[] | null
          is_public: boolean
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          archetype?: string | null
          personality: Json
          capabilities: Json
          knowledge_base_ids?: string[] | null
          is_public?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          archetype?: string | null
          personality?: Json
          capabilities?: Json
          knowledge_base_ids?: string[] | null
          is_public?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_versions: {
        Row: {
          id: string
          agent_id: string
          version: number
          personality: Json
          capabilities: Json
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          version: number
          personality: Json
          capabilities: Json
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          version?: number
          personality?: Json
          capabilities?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_versions_agent_id_fkey"
            columns: ["agent_id"]
            referencedRelation: "agents"
            referencedColumns: ["id"]
          }
        ]
      }
      knowledge_bases: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_bases_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      knowledge_nodes: {
        Row: {
          id: string
          knowledge_base_id: string
          title: string
          content: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          knowledge_base_id: string
          title: string
          content: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          knowledge_base_id?: string
          title?: string
          content?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_nodes_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          }
        ]
      }
      experiments: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          configuration: Json
          status: string
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          configuration: Json
          status?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          configuration?: Json
          status?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      experiment_runs: {
        Row: {
          id: string
          experiment_id: string
          agent_id: string
          status: string
          results: Json | null
          created_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          experiment_id: string
          agent_id: string
          status?: string
          results?: Json | null
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          experiment_id?: string
          agent_id?: string
          status?: string
          results?: Json | null
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiment_runs_agent_id_fkey"
            columns: ["agent_id"]
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_runs_experiment_id_fkey"
            columns: ["experiment_id"]
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_metrics: {
        Row: {
          id: string
          agent_id: string
          experiment_id: string | null
          run_id: string | null
          metric_type: string
          value: number
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          experiment_id?: string | null
          run_id?: string | null
          metric_type: string
          value: number
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          experiment_id?: string | null
          run_id?: string | null
          metric_type?: string
          value?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_metrics_agent_id_fkey"
            columns: ["agent_id"]
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_metrics_experiment_id_fkey"
            columns: ["experiment_id"]
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_metrics_run_id_fkey"
            columns: ["run_id"]
            referencedRelation: "experiment_runs"
            referencedColumns: ["id"]
          }
        ]
      }
      social_posts: {
        Row: {
          id: string
          agent_id: string
          content: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          content: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          content?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_agent_id_fkey"
            columns: ["agent_id"]
            referencedRelation: "agents"
            referencedColumns: ["id"]
          }
        ]
      }
      social_interactions: {
        Row: {
          id: string
          post_id: string
          agent_id: string
          interaction_type: string
          content: string | null
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          agent_id: string
          interaction_type: string
          content?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          agent_id?: string
          interaction_type?: string
          content?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_interactions_agent_id_fkey"
            columns: ["agent_id"]
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_interactions_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          }
        ]
      }
      agent_deployments: {
        Row: {
          id: string
          agent_id: string
          environment: string
          status: string
          configuration: Json
          metrics: Json | null
          created_at: string
          deployed_at: string | null
          terminated_at: string | null
        }
        Insert: {
          id?: string
          agent_id: string
          environment: string
          status?: string
          configuration: Json
          metrics?: Json | null
          created_at?: string
          deployed_at?: string | null
          terminated_at?: string | null
        }
        Update: {
          id?: string
          agent_id?: string
          environment?: string
          status?: string
          configuration?: Json
          metrics?: Json | null
          created_at?: string
          deployed_at?: string | null
          terminated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_deployments_agent_id_fkey"
            columns: ["agent_id"]
            referencedRelation: "agents"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          is_read: boolean
          related_entity_id: string | null
          related_entity_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          is_read?: boolean
          related_entity_id?: string | null
          related_entity_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          related_entity_id?: string | null
          related_entity_type?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
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
