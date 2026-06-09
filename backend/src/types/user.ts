export type User = {
    id: string,
    name: string,
    email: string,
    password: string,
   role: "admin" | "editor" | "viewer",
   created_at?: Date
}