export interface User {
  username: string;
  email: string;
  profilePicture: string;
  description: string;
  type: "admin" | "cinemaWorker" | "user";
}
