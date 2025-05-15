import { Button, Form, Input, message, Modal, Select, Space, Table } from "antd";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import React, { useEffect, useState } from "react";
import { auth, functions } from "../firebaseConfig";
import { Movie } from "../types/movie";

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

  const fetchPersonalMovies = async () => {
    const res: any = await getPersonalMovies();
    if (res.data.status === "success") {
      setPersonalMovies(res.data.personalMovies);
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
    // Get current user id
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

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
    { title: "State", dataIndex: "state", key: "state" },
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
          <Button onClick={() => handleEdit(record)}>Edit</Button>
          <Button danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button type="primary" onClick={handleAdd} style={{ marginBottom: 16 }}>
        Add Personal Movie
      </Button>
      <Table rowKey="id" dataSource={personalMovies} columns={columns} />
      <Modal
        title={editingPersonalMovie ? "Edit Personal Movie" : "Add Personal Movie"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="state" label="State" rules={[{ required: true, message: "Please select the state" }]}>
            <Select>
              <Select.Option value="toWatch">To Watch</Select.Option>
              <Select.Option value="watched">Watched</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="rating" label="Rating" rules={[{ required: true, message: "Please enter the rating" }]}>
            <Input type="number" min={0} max={10} />
          </Form.Item>
          <Form.Item name="review" label="Review">
            <Input.TextArea />
          </Form.Item>

          <Form.Item name="movieId" label="Movie" rules={[{ required: true, message: "Please select a movie" }]}>
            <Select showSearch optionFilterProp="children" placeholder="Select a movie">
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

export default PersonalMoviesPage;
