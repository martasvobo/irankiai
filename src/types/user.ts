export interface User {
  username: string;
  email: string;
  description: string;
  type: "admin" | "cinemaWorker" | "user";
}
