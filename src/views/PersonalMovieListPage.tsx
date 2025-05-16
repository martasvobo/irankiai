import { Button, Form, Input, InputNumber, message, Modal, Select, Space, Table, Card, Row, Col } from "antd";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import React, { useEffect, useState } from "react";
import { auth, functions } from "../firebaseConfig";
import { Movie } from "../types/movie";
import MovieDetails from "./MovieDetails";

const getPersonalMovies = httpsCallable(functions, "getPersonalMovies");
const createPersonalMovie = httpsCallable(functions, "createPersonalMovie");
const updatePersonalMovie = httpsCallable(functions, "updatePersonalMovie");
const deletePersonalMovie = httpsCallable(functions, "deletePersonalMovie");
const getMovies = httpsCallable(functions, "getMovies");

const PersonalMoviesPage: React.FC = () => {
  const [personalMovies, setPersonalMovies] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersonalMovie, setEditingPersonalMovie] = useState<any | null>(null);
  const [form] = Form.useForm();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const fetchPersonalMovies = async () => {
    const res: any = await getPersonalMovies();
    if (res.data.status === "success") {
      // Only show movies belonging to the current user
      const userId = currentUserId;
      if (userId) {
        setPersonalMovies(res.data.personalMovies.filter((pm: any) => pm.userId === userId));
      } else {
        setPersonalMovies([]);
      }
    }
  };

  useEffect(() => {
    // Fetch movies for dropdown
    const fetchMovies = async () => {
      try {
        const result = await getMovies();
        setMovies((result.data as any).movies || []);
      } catch (error) {
        // handle error
      }
    };
    fetchMovies();
    // Get current user id and fetch personal movies after user is set
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  // Fetch personal movies when currentUserId changes
  useEffect(() => {
    if (currentUserId) {
      fetchPersonalMovies();
    } else {
      setPersonalMovies([]);
    }
  }, [currentUserId]);

  const handleAdd = () => {
    setEditingPersonalMovie(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingPersonalMovie(record);
    form.setFieldsValue({
      ...record,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deletePersonalMovie({ id });
    message.success("Personal movie deleted");
    fetchPersonalMovies();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        userId: currentUserId,
      };
      if (editingPersonalMovie) {
        await updatePersonalMovie({ id: editingPersonalMovie.id, ...payload });
        message.success("Personal movie updated");
      } else {
        await createPersonalMovie(payload);
        message.success("Personal movie created");
      }
      setIsModalOpen(false);
      fetchPersonalMovies();
    } catch (e) {
      // validation error
    }
  };

  const columns = [
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      render: (state: string) => (state === "toWatch" ? "To watch" : state === "watched" ? "Watched" : state),
    },
    { title: "Rating", dataIndex: "rating", key: "rating" },
    { title: "Review", dataIndex: "review", key: "review" },

    {
      title: "Movie",
      dataIndex: "movieId",
      key: "movieId",
      render: (id: string) => movies.find((m) => m.id === id)?.title || id,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            onClick={() => {
              const movie = movies.find((m) => m.id === record.movieId) || null;
              setSelectedMovie(movie);
              setDetailsModalOpen(true);
            }}
          >
            View Details
          </Button>
          <Button onClick={() => handleEdit(record)}>Edit</Button>
          <Button danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-8 pb-16 bg-gray-50 min-h-screen">
      <Row justify="center" className="mb-6">
        <Col>
          <Button type="primary" onClick={handleAdd} size="large">
            Add Personal Movie
          </Button>
        </Col>
      </Row>
      <Card className="shadow-md rounded-xl bg-white">
        <Table
          rowKey="id"
          dataSource={personalMovies}
          columns={columns}
          pagination={{ pageSize: 8 }}
          className="personal-movies-table"
          style={{ borderRadius: 12, overflow: "hidden" }}
        />
      </Card>
      <Modal
        title={editingPersonalMovie ? "Edit Personal Movie" : "Add Personal Movie"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        className="personal-movies-modal"
        bodyStyle={{ borderRadius: 12, padding: 32 }}
      >
        <Form form={form} layout="vertical" className="space-y-4">
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
      <Modal
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        footer={null}
        title={selectedMovie?.title || "Movie Details"}
      >
        {selectedMovie && <MovieDetails movie={selectedMovie} />}
      </Modal>
    </div>
  );
};

export default PersonalMoviesPage;
