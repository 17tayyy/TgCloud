
export interface APIFolder {
  id: number;
  name: string;
  file_count: number;
  created_at: string;
}

export interface APIFile {
  id: number;
  filename: string;
  size: string;
  encrypted: boolean;
  uploaded_at: string;
}

export interface APIStats {
  total_space_used: string;
  total_files: number;
  total_folders: number;
  space_used_for_folder: Record<string, string>;
  encryption_enabled: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ShareResponse {
  message: string;
}

export interface SharedFileInfo {
  filename: string;
  size: string;
  uploaded_at: string;
  encrypted: boolean;
}

export interface SharedFolderInfo {
  foldername: string;
  files: Array<{
    filename: string;
    size: string;
    encrypted: boolean;
    uploaded_at: string;
  }>;
  created_at: string;
}
