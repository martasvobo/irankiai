import React from "react";
import { Card } from "antd";
import { Movie } from "../types/movie";

interface MovieDetailsProps {
  movie: Movie;
}

const MovieDetails: React.FC<MovieDetailsProps> = ({ movie }) => (
  <Card title={movie.title} className="shadow rounded-lg">
    <p>Director: {movie.director}</p>
    <p>Release Date: {new Date(movie.releaseDate).toDateString()}</p>
  </Card>
);

export default MovieDetails;
