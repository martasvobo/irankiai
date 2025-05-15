import { Card, List, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";
import { Movie } from "../types/movie";

const getMovies = httpsCallable(functions, "getMovies");

export default function MovieListPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const result = await getMovies();
        setMovies((result.data as any).movies as Movie[]);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">All Movies</h1>
      <List
        grid={{ gutter: 16, column: 4 }}
        dataSource={movies}
        renderItem={(movie) => (
          <List.Item>
            <Card title={movie.title} className="shadow rounded-lg">
              <p>Director: {movie.director}</p>
              <p>Release Date: {new Date(movie.releaseDate).toDateString()}</p>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}
