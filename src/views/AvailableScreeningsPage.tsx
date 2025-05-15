import React, { useEffect, useState } from "react";
import { Button, Card, List, Spin } from "antd";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";
import { Movie } from "../types/movie";
import { Cinema } from "../types/cinema";
import { MovieScreening } from "../types/movieScreening";

const getMovieScreenings = httpsCallable(functions, "getMovieScreenings");
const getMovies = httpsCallable(functions, "getMovies");
const getCinemas = httpsCallable(functions, "getCinemas");

const AvailableScreeningsPage: React.FC = () => {
  const [screenings, setScreenings] = useState<any[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [screeningsRes, moviesRes, cinemasRes] = await Promise.all([
        getMovieScreenings(),
        getMovies(),
        getCinemas(),
      ]);
      setScreenings((screeningsRes.data as any).movieScreenings || []);
      setMovies((moviesRes.data as any).movies || []);
      setCinemas((cinemasRes.data as any).cinemas || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getMovieTitle = (id: string) => movies.find((m) => m.id === id)?.title || id;
  const getCinemaName = (id: string) => cinemas.find((c) => c.id === id)?.name || id;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Available Movie Screenings</h2>
      {loading ? (
        <Spin size="large" />
      ) : (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={screenings}
          renderItem={(screening) => (
            <List.Item>
              <Card title={getMovieTitle(screening.movieId)} extra={<span>{getCinemaName(screening.cinemaId)}</span>}>
                <p>
                  Date:{" "}
                  {new Date(screening.date.seconds ? screening.date.seconds * 1000 : screening.date).toLocaleString()}
                </p>
                <p>Hall: {screening.hall}</p>
                <p>Tickets Sold: {screening.tickedCount}</p>
                <Button type="primary" disabled>
                  Purchase Ticket
                </Button>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default AvailableScreeningsPage;
