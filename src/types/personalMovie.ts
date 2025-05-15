export interface PersonalMovie {
  state: "toWatch" | "watched";
  rating: number;
  review: string;
  updateDate: Date;
  gameRating: number;
  movieId: string;
  userId: string;
}
