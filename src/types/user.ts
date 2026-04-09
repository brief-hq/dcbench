export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member" | "viewer";
  teamId: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: string;
}
