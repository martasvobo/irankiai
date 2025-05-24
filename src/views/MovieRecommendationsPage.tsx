import { Card, Modal, Select, Spin, message, List, Row, Space, Button, Table, Form, InputNumber, Input } from "antd";
import { stripePromise } from "../stripe";
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
const createPersonalMovie = httpsCallable(functions, "createPersonalMovie");

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
  const [searchTickets, setSearchTickets] = useState(false);
  const [screenings, setScreenings] = useState<any[]>([]);
  const [screeningsLoading, setScreeningsLoading] = useState(false);
  const [screeningsError, setScreeningsError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [personalMovieModalOpen, setPersonalMovieModalOpen] = useState(false);
  const [form] = Form.useForm();

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
        const userMovies = (userMoviesRes.data.personalMovies as PersonalMovie[]).filter(
          (pm: PersonalMovie) => pm.userId === currentUserId
        );

        for (const userMovie of userMovies) {
          const similarUserIds = [
            ...new Set(
              userMoviesRes.data.personalMovies
                .filter((pm: PersonalMovie) => pm.userId !== currentUserId && pm.movieId === userMovie.movieId)
                .map((pm: PersonalMovie) => pm.userId)
            ),
          ];

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
                (Array.isArray(movie.genres) && movie.genres.some((genreId) => selectedGenreIds.includes(genreId)));

              const notAlreadyOwned = !userMovies.some((m) => m.movieId === movie.id);

              if (isInGenre && notAlreadyOwned) {
                if (!recMap[movie.id]) {
                  recMap[movie.id] = { movie, score: 0 };
                }
                recMap[movie.id].score +=
                  (userMoviesRes.data.personalMovies as PersonalMovie[]).find(
                    (pm) => pm.userId === userId && pm.movieId === movie.id
                  )?.rating ?? 0;
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
              console.log("Adding personal movie for record:", record);
              const movie = movies.find((m) => m.id === record.id) || null;
              console.log("Selected movie for personal movie modal:", movie);
              setSelectedMovie(movie);
              setPersonalMovieModalOpen(true);
            }}
          >
            Add to Personal Movies
          </Button>
          <Button
            onClick={async () => {
              const movie = movies.find((m) => m.id === record.id) || null;
              setSelectedMovie(movie);
              setSearchTickets(true);
              setScreeningsLoading(true);
              setScreeningsError(null);
              try {
                const getMovieScreenings = httpsCallable(functions, "getMovieScreenings");
                const res: any = await getMovieScreenings();
                if (res.data && Array.isArray(res.data.movieScreenings)) {
                  const filtered = res.data.movieScreenings.filter((s: any) => s.movieId === movie?.id);
                  setScreenings(filtered);
                } else {
                  setScreenings([]);
                }
              } catch (e) {
                setScreeningsError("Failed to load screenings");
                setScreenings([]);
              } finally {
                setScreeningsLoading(false);
              }
            }}
          >
            Find Tickets
          </Button>
        </Space>
      ),
    },
  ];

  const handleAddPersonalMovieModalOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        userId: currentUserId,
      };

      await createPersonalMovie(payload);
      message.success("Personal movie created");

      setRecommendations((prev) => prev.filter((movie) => movie.id !== values.movieId));
      setPersonalMovieModalOpen(false);
      form.resetFields();
    } catch (e) {
      // validation error
    }
  };

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
      <Modal open={detailsModalOpen} onCancel={() => setDetailsModalOpen(false)} footer={null}>
        {selectedMovie && <MovieDetails movie={selectedMovie} />}
      </Modal>
      <Modal
        title={selectedMovie ? `Available Screenings for "${selectedMovie.title}"` : "Available Screenings"}
        open={searchTickets}
        onCancel={() => setSearchTickets(false)}
        footer={null}
        bodyStyle={{ borderRadius: 12, padding: 32 }}
      >
        {screeningsLoading ? (
          <div style={{ textAlign: "center", padding: 32 }}>
            <Spin size="large" />
          </div>
        ) : screeningsError ? (
          <div style={{ textAlign: "center", color: "red" }}>{screeningsError}</div>
        ) : screenings.length === 0 ? (
          <div style={{ textAlign: "center" }}>No screenings available for this movie.</div>
        ) : (
          <List
            dataSource={screenings}
            renderItem={(screening) => {
              const isCheckingOut = checkoutLoading === screening.id;
              let dateStr = "";
              const d = screening.date;
              if (d && typeof d === "object" && typeof d.seconds === "number") {
                dateStr = new Date(d.seconds * 1000).toLocaleString();
              } else if (d && typeof d === "object" && d.$d) {
                dateStr = new Date(d.$d).toLocaleString();
              } else if (typeof d === "string" || d instanceof Date) {
                const parsed = new Date(d);
                dateStr = isNaN(parsed.getTime()) ? "Invalid date" : parsed.toLocaleString();
              } else {
                dateStr = "Invalid date";
              }
              return (
                <List.Item>
                  <Card title={selectedMovie?.title || "Movie"}>
                    <p>Date: {dateStr}</p>
                    <p>Hall: {screening.hall}</p>
                    <p>Tickets Sold: {screening.tickedCount}</p>
                    <Button
                      type="primary"
                      loading={isCheckingOut}
                      onClick={async () => {
                        setCheckoutLoading(screening.id);
                        try {
                          const createCheckoutSession = httpsCallable(functions, "createCheckoutSession");
                          const { data } = await createCheckoutSession({ screeningId: screening.id });
                          const sessionId = (data as any).sessionId as string;
                          const stripe = await stripePromise;
                          if (!stripe) throw new Error("Stripe.js failed to load");
                          const { error } = await stripe.redirectToCheckout({ sessionId });
                          if (error) console.error("Stripe redirect error:", error.message);
                        } catch (e) {
                          message.error("Failed to start checkout");
                        } finally {
                          setCheckoutLoading(null);
                        }
                      }}
                    >
                      Purchase Ticket
                    </Button>
                  </Card>
                </List.Item>
              );
            }}
          />
        )}
      </Modal>
      <Modal
        title={"Add Personal Movie"}
        open={personalMovieModalOpen}
        onOk={handleAddPersonalMovieModalOk}
        onCancel={() => setPersonalMovieModalOpen(false)}
        className="personal-movies-modal"
        bodyStyle={{ borderRadius: 12, padding: 32 }}
      >
        <Form form={form} layout="vertical" className="space-y-4" initialValues={{ movieId: selectedMovie?.id }}>
          <Form.Item
            name="state"
            label="State"
            rules={[{ required: true, message: "Please select the state" }]}
            style={{ marginBottom: 16 }}
          >
            <Select size="large">
              <Select.Option value="toWatch">To Watch</Select.Option>
              <Select.Option value="watched">Watched</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="rating"
            label="Rating"
            rules={[
              {
                required: true,
                message: "Please enter the rating",
              },
              {
                type: "number",
                min: 0,
                max: 10,
                message: "Rating must be between 0 and 10",
              },
            ]}
            style={{ marginBottom: 16 }}
          >
            <InputNumber min={0} max={10} size="large" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="review" label="Review" style={{ marginBottom: 16 }}>
            <Input.TextArea rows={3} size="large" />
          </Form.Item>
          <Form.Item
            name="movieId"
            label="Movie"
            rules={[{ required: true, message: "Please select a movie" }]}
            style={{ marginBottom: 0 }}
          >
            <Select showSearch optionFilterProp="children" placeholder="Select a movie" size="large">
              {movies.map((movie) => (
                <Select.Option key={movie.id} value={movie.id}>
                  {movie.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RecommendationPage;
