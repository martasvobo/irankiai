import { Button, Card, Form, Input, List, Modal, Select, Spin, message } from "antd";
import "antd/dist/reset.css";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import React, { useEffect, useState } from "react";
import { auth, db, functions } from "../firebaseConfig";
import "@ant-design/v5-patch-for-react-19";
import { Movie } from "../types/movie";
import { Genre } from "../types/genre";

const getGenres = httpsCallable(functions, "getGenres");
const getMovies = httpsCallable(functions, "getMovies");
const createMovie = httpsCallable(functions, "createMovie");
const updateMovie = httpsCallable(functions, "updateMovie");
const deleteMovie = httpsCallable(functions, "deleteMovie");

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [form] = Form.useForm();
  const [isAdmin, setIsAdmin] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [genreList, setGenreList] = useState<Genre[]>([]);


  useEffect(() => {
    const fetchUserData = async (uid: string) => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().type === "admin");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Helper: Wrap a promise with a timeout.
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeoutMs)),
    ]);
  };

  // Fetch movies from the backend.
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const result = await withTimeout(getMovies(), 10000);
        setMovies((result.data as any).movies as Movie[]);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [messageApi]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const result: any = await getGenres();
        setGenreList(result.data.genres as Genre[]);
      } catch (error) {
        console.error("Failed to fetch genres:", error);
      }
    };

    fetchGenres();
  }, []);


  const pressAddMovieButton = () => {
    if (!isAdmin) {
      messageApi.error("Only admins can add movies.");
      return;
    }
    setEditingMovie(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const validateDetailsAndStoreMovie = async () => {
    if (!isAdmin) {
      messageApi.error("You do not have permission.");
      return;
    }
    try {
      const details = await form.validateFields();
      if (!editingMovie) {
        const duplicateMovie = movies.find(
          (movie) =>
            movie.title === details.title &&
            movie.director === details.director &&
            movie.releaseDate === details.releaseDate
        );
        if (duplicateMovie) {
          messageApi.error("A movie with the same title, director, and release date already exists.");
          return;
        }
        await createMovie(details);
        await getMovies().then((result) => {
          setMovies((result.data as any).movies as Movie[]);
        });
        messageApi.success("Movie added successfully!");
      } else {
        const duplicateMovie = movies.find(
          (movie) =>
            movie.id !== editingMovie.id &&
            movie.title === details.title &&
            movie.director === details.director &&
            movie.releaseDate === details.releaseDate
        );
        if (duplicateMovie) {
          messageApi.error("A movie with the same title, director, and release date already exists.");
          return;
        }
        await updateMovie({ id: editingMovie.id, ...details });
        await getMovies().then((result) => {
          setMovies((result.data as any).movies as Movie[]);
        });
        messageApi.success("Movie updated successfully!");
      }
      setIsModalOpen(false);
    } catch (error) {
      messageApi.error("Please check the movie details and try again.");
    }
  };

  const pressEditMovieButton = (movie: Movie) => {
    if (!isAdmin) {
      messageApi.error("You do not have permission to edit movies.");
      return;
    }
    setEditingMovie(movie);
    form.setFieldsValue(movie);
    setIsModalOpen(true);
  };

  const confirmAndDeleteMovie = (id: string) => {
    if (!isAdmin) {
      messageApi.error("Only admins can delete movies.");
      return;
    }
    try {
      Modal.confirm({
        title: "Are you sure you want to delete this movie?",
        content: "This action cannot be undone.",
        okText: "Yes",
        cancelText: "Cancel",
        onOk: async () => {
          try {
            console.log("Attempting to delete movie with id:", id);
            await deleteMovie({ id });
            await getMovies().then((result) => {
              setMovies((result.data as any).movies as Movie[]);
            });
            messageApi.success("Movie deleted successfully!");
          } catch (err) {
            console.error("Error during deletion:", err);
            messageApi.error("Failed to delete movie. Please try again.");
          }
        },
        onCancel: () => {
          console.log("Deletion canceled by the user.");
        },
      });
    } catch (error) {
      if (window.confirm("Are you sure you want to delete this movie? This action cannot be undone.")) {
        deleteMovie({ id })
          .then(() => getMovies())
          .then((result) => {
            setMovies((result.data as any).movies as Movie[]);
            messageApi.success("Movie deleted successfully!");
          })
          .catch((err) => {
            console.error("Error deleting movie (fallback):", err);
            messageApi.error("Failed to delete movie. Please try again.");
          });
      }
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-4">
      {contextHolder}
      <h1 className="text-2xl mb-4">Movies</h1>
      {isAdmin && (
        <div className="mb-4">
          <Button type="primary" onClick={pressAddMovieButton}>
            Add Movie
          </Button>
        </div>
      )}
      <List
        grid={{ gutter: 16, column: 4 }}
        dataSource={movies}
        renderItem={(movie) => (
          <List.Item>
            <Card
              title={movie.title}
              actions={
                isAdmin
                  ? [
                      <Button type="link" key="edit" onClick={() => pressEditMovieButton(movie)}>
                        Edit
                      </Button>,
                      <Button type="link" danger key="delete" onClick={() => confirmAndDeleteMovie(movie.id)}>
                        Delete
                      </Button>,
                    ]
                  : []
              }
            >
              <p>Director: {movie.director}</p>
              <p>Release Date: {new Date(movie.releaseDate).toDateString()}</p>
            </Card>
          </List.Item>
        )}
      />
      <Modal
        title={editingMovie ? "Edit Movie" : "Add Movie"}
        open={isModalOpen}
        onOk={validateDetailsAndStoreMovie}
        onCancel={handleModalCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Please enter the movie title" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="director"
            label="Director"
            rules={[{ required: true, message: "Please enter the director's name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="releaseDate"
            label="Release Date"
            rules={[{ required: true, message: "Please enter the release date" }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item
            name="genres"
            label="Genres"
            rules={[{ required: true, message: "Please select at least one genre" }]}
          >
            <Select mode="multiple" placeholder="Select genres">
              {genreList.map((genre) => (
                <Select.Option key={genre.id} value={genre.id}>
                  {genre.genre}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
