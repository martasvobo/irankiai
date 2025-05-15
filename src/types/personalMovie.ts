export interface PersonalMovie {
  state: "toWatch" | "watched";
  rating: number;
  review: string;
  movieId: string;
  userId: string;
}
