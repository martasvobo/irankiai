import React, { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { getFunctions } from "firebase/functions";
import { Button, Card, List, Spin, Modal, Form, Input } from "antd";
import "antd/dist/reset.css";

const functions = getFunctions();
const getMovies = httpsCallable(functions, "getMovies");
const createMovie = httpsCallable(functions, "createMovie");
const updateMovie = httpsCallable(functions, "updateMovie");
const deleteMovie = httpsCallable(functions, "deleteMovie");

export default function MainPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [form] = Form.useForm();

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

  const handleAddMovie = () => {
    setEditingMovie(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditMovie = (movie: Movie) => {
    setEditingMovie(movie);
    form.setFieldsValue(movie);
    setIsModalOpen(true);
  };

  const handleDeleteMovie = (id: string) => {
    deleteMovie({ id })
      .then(() => getMovies())
      .then((result) => {
        setMovies((result.data as any).movies as Movie[]);
      })
      .catch((error) => {
        console.error("Error deleting movie:", error);
      });
  };

  const handleModalOk = () => {
    form
      .validateFields()
      .then((values) => {
        if (editingMovie) {
          // Update movie
          updateMovie({ id: editingMovie.id, ...values })
            .then(() => getMovies())
            .then((result) => {
              setMovies((result.data as any).movies as Movie[]);
              setIsModalOpen(false);
            })
            .catch((error) => {
              console.error("Error updating movie:", error);
            });
        } else {
          // Create new movie
          createMovie(values)
            .then(() => getMovies())
            .then((result) => {
              setMovies((result.data as any).movies as Movie[]);
              setIsModalOpen(false);
            })
            .catch((error) => {
              console.error("Error creating movie:", error);
            });
        }
      })
      .catch((error) => {
        console.error("Validation failed:", error);
      });
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
      <h1 className="text-2xl mb-4">Movies</h1>
      <div className="mb-4">
        <Button type="primary" onClick={handleAddMovie}>
          Add Movie
        </Button>
      </div>
      <List
        grid={{ gutter: 16, column: 4 }}
        dataSource={movies}
        renderItem={(movie) => (
          <List.Item>
            <Card
              title={movie.title}
              actions={[
                <Button type="link" onClick={() => handleEditMovie(movie)}>
                  Edit
                </Button>,
                <Button
                  type="link"
                  danger
                  onClick={() => handleDeleteMovie(movie.id)}
                >
                  Delete
                </Button>,
              ]}
            >
              <p>{movie.director}</p>
            </Card>
          </List.Item>
        )}
      />
      <Modal
        title={editingMovie ? "Edit Movie" : "Add Movie"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[
              { required: true, message: "Please enter the movie title" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="director"
            label="Director"
            rules={[
              { required: true, message: "Please enter the director's name" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="releaseDate"
            label="Release Date"
            rules={[
              { required: true, message: "Please enter the release date" },
            ]}
          >
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
