export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectStatus = 'draft' | 'active' | 'archived';

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  email: string;
  full_name?: string | null;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdate {
  id?: string;
  email?: string;
  full_name?: string | null;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectInsert {
  id?: string;
  user_id: string;
  name: string;
  status?: ProjectStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectUpdate {
  id?: string;
  user_id?: string;
  name?: string;
  status?: ProjectStatus;
  created_at?: string;
  updated_at?: string;
}

export interface IdeaRow {
  id: string;
  project_id: string;
  title: string;
  description: string;
  ai_metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface IdeaInsert {
  id?: string;
  project_id: string;
  title: string;
  description?: string;
  ai_metadata?: Json;
  created_at?: string;
  updated_at?: string;
}

export interface IdeaUpdate {
  id?: string;
  project_id?: string;
  title?: string;
  description?: string;
  ai_metadata?: Json;
  created_at?: string;
  updated_at?: string;
}

export interface ExampleRow {
  id: string;
  project_id: string;
  content: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface ExampleInsert {
  id?: string;
  project_id: string;
  content: string;
  type: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExampleUpdate {
  id?: string;
  project_id?: string;
  content?: string;
  type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductRow {
  id: string;
  project_id: string;
  content: Json;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface ProductInsert {
  id?: string;
  project_id: string;
  content?: Json;
  metadata?: Json;
  created_at?: string;
  updated_at?: string;
}

export interface ProductUpdate {
  id?: string;
  project_id?: string;
  content?: Json;
  metadata?: Json;
  created_at?: string;
  updated_at?: string;
}

export interface SalesAssetRow {
  id: string;
  project_id: string;
  asset_type: string;
  content: Json;
  created_at: string;
  updated_at: string;
}

export interface SalesAssetInsert {
  id?: string;
  project_id: string;
  asset_type: string;
  content?: Json;
  created_at?: string;
  updated_at?: string;
}

export interface SalesAssetUpdate {
  id?: string;
  project_id?: string;
  asset_type?: string;
  content?: Json;
  created_at?: string;
  updated_at?: string;
}

export interface StoreRow {
  id: string;
  project_id: string;
  content: Json;
  metadata: Json;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoreInsert {
  id?: string;
  project_id: string;
  content?: Json;
  metadata?: Json;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StoreUpdate {
  id?: string;
  project_id?: string;
  content?: Json;
  metadata?: Json;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: ProjectRow;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
        Relationships: [
          {
            foreignKeyName: 'projects_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      ideas: {
        Row: IdeaRow;
        Insert: IdeaInsert;
        Update: IdeaUpdate;
        Relationships: [
          {
            foreignKeyName: 'ideas_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      examples: {
        Row: ExampleRow;
        Insert: ExampleInsert;
        Update: ExampleUpdate;
        Relationships: [
          {
            foreignKeyName: 'examples_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: ProductRow;
        Insert: ProductInsert;
        Update: ProductUpdate;
        Relationships: [
          {
            foreignKeyName: 'products_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      sales_assets: {
        Row: SalesAssetRow;
        Insert: SalesAssetInsert;
        Update: SalesAssetUpdate;
        Relationships: [
          {
            foreignKeyName: 'sales_assets_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      stores: {
        Row: StoreRow;
        Insert: StoreInsert;
        Update: StoreUpdate;
        Relationships: [
          {
            foreignKeyName: 'stores_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

type PublicTables = Database['public']['Tables'];

export type Tables<TableName extends keyof PublicTables> = PublicTables[TableName] extends {
  Row: infer Row;
}
  ? Row
  : never;

export type TablesInsert<TableName extends keyof PublicTables> =
  PublicTables[TableName] extends {
    Insert: infer Insert;
  }
    ? Insert
    : never;

export type TablesUpdate<TableName extends keyof PublicTables> =
  PublicTables[TableName] extends {
    Update: infer Update;
  }
    ? Update
    : never;
