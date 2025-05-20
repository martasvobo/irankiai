import { Card, Modal, Select, Spin, message, List, Row, Space, Button, Table } from "antd";
import "antd/dist/reset.css";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import React, { useEffect, useState } from "react";
import { auth, functions } from "../firebaseConfig";
import { Movie } from "../types/movie";
import { Genre } from "../types/genre";
import { PersonalMovie } from "../types/personalMovie";
import MovieDetails from "./MovieDetails";

const getGenres = httpsCallable(functions, "getGenres");
const getPersonalMovies = httpsCallable(functions, "getPersonalMovies");
const getMovies = httpsCallable(functions, "getMovies");

const RecommendationPage: React.FC = () => {
  const [chosen, setChonsen] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);   
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const genreModalShown = React.useRef(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [createPersonalMovie, setCreatePersonalMovie] = useState(false);
  const [searchTickets, setSearchTickets] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  useEffect(() => {
  const fetchData = async () => {
    try {
        setLoading(true);

        const result: any = await getMovies();
        setMovies(result.data.movies);

        if (!genreModalShown.current) {
            genreModalShown.current = true;

            const genreResult: any = await getGenres();
            const genreList = genreResult.data.genres as Genre[];

            let tempSelectedGenres: string[] = [];

            Modal.confirm({
            title: "Choose Genre(s)",
            content: (
                <Select
                mode="multiple"
                style={{ width: "100%", marginTop: 16 }}
                placeholder="Select genre(s) or leave empty for all"
                onChange={(values: string[]) => {
                    tempSelectedGenres = values;
                }}
                >
                {genreList.map((genreObj) => (
                    <Select.Option key={genreObj.id} value={genreObj.id}>
                    {genreObj.genre}
                    </Select.Option>
                ))}
                </Select>
            ),
            okText: "OK",
            cancelButtonProps: { style: { display: "none" } },
            closable: false,
            maskClosable: false,
            onOk: () => {
                setSelectedGenreIds(tempSelectedGenres);
                setChonsen(true);
            },
            });
        } 
        } catch (error) {
        console.error("Error loading data:", error);
        }
    };

    fetchData();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUserId(user ? user.uid : null);
        });
        return () => unsubscribe();
    }, []);

  useEffect(() => {
    if (!chosen || !currentUserId || movies.length === 0) return;

    const fetchRecommendations = async () => {
        try {
            const recMap: Record<string, { movie: Movie; score: number }> = {};
            const userMoviesRes: any = await getPersonalMovies();
            const userMovies = (userMoviesRes.data.personalMovies as PersonalMovie[]).filter((pm: PersonalMovie) => pm.userId === currentUserId);

        for (const userMovie of userMovies) {
            const similarUserIds = [...new Set(userMoviesRes.data.personalMovies
                .filter((pm: PersonalMovie) => pm.userId !== currentUserId && pm.movieId === userMovie.movieId)
                .map((pm: PersonalMovie) => pm.userId))];

          for (const userId of similarUserIds) {
            const otherUserMovies = (userMoviesRes.data.personalMovies as PersonalMovie[])
                .filter((pm: PersonalMovie) => pm.userId === userId && pm.movieId !== userMovie.movieId)
                .map((pm: PersonalMovie) => pm.movieId)
                .map((movieId: string) => movies.find((movie: Movie) => movie.id === movieId))
                .filter(Boolean) as Movie[];

            for (const movie of otherUserMovies) {
                console.log("Movie:", movie);
              const isInGenre =
                selectedGenreIds.length === 0 ||
                (Array.isArray(movie.genres) &&
                    movie.genres.some((genreId) => selectedGenreIds.includes(genreId)));

              const notAlreadyOwned = !userMovies.some((m) => m.movieId === movie.id);

              if (isInGenre && notAlreadyOwned) {
                if (!recMap[movie.id]) {
                  recMap[movie.id] = { movie, score: 0 };
                }
                recMap[movie.id].score += (userMoviesRes.data.personalMovies as PersonalMovie[])
                    .find((pm) => pm.userId === userId && pm.movieId === movie.id)?.rating ?? 0;
              }
            }
          }
        }

        const sortedRecommendations = Object.values(recMap)
          .map((entry) => ({
            ...entry.movie,
            score: entry.score,
          }))
          .sort((a, b) => b.score - a.score);

        setRecommendations(sortedRecommendations);
      } catch (error) {
        console.error("Failed to generate recommendations", error);
        messageApi.error("Error while generating recommendations.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [chosen]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        {contextHolder}
        <Spin size="large" />
      </div>
    );
  }

  const columns = [
    {
      title: "Recommendations",
      dataIndex: "id",
      key: "id",
      render: (id: string) => movies.find((m) => m.id === id)?.title || id,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            onClick={() => {
              const movie = movies.find((m) => m.id === record.id) || null;
              setSelectedMovie(movie);
              setDetailsModalOpen(true);
            }}
          >
            View Details
          </Button>
          <Button
            onClick={() => {
              const movie = movies.find((m) => m.id === record.id) || null;
              setSelectedMovie(movie);
              setCreatePersonalMovie(true);
            }}
          >
            Add to Personal Movies
          </Button>
          <Button
            onClick={() => {
              const movie = movies.find((m) => m.id === record.id) || null;
              setSelectedMovie(movie);
              setSearchTickets(true);
            }}
          >
            Find Tickets
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-8 pb-16 bg-gray-50 min-h-screen">
      <Card className="shadow-md rounded-xl bg-white">
        <Table
          rowKey="id"
          dataSource={recommendations}
          columns={columns}
          pagination={{ pageSize: 8 }}
          className="personal-movies-table"
          style={{ borderRadius: 12, overflow: "hidden" }}
        />
      </Card>
      <Modal
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        footer={null}
        >
            {selectedMovie && <MovieDetails movie={selectedMovie} />}
        </Modal>
    </div>
  );
}

export default RecommendationPage;