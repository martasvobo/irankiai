import React, { useEffect, useState } from "react";
import { Button, Modal, Form, Input, Table, Space, message, Select, DatePicker } from "antd";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";
import { Movie } from "../types/movie";
import { Cinema } from "../types/cinema";
import { MovieScreening } from "../types/movieScreening";

const getMovieScreenings = httpsCallable(functions, "getMovieScreenings");
const createMovieScreening = httpsCallable(functions, "createMovieScreening");
const updateMovieScreening = httpsCallable(functions, "updateMovieScreening");
const deleteMovieScreening = httpsCallable(functions, "deleteMovieScreening");
const getMovies = httpsCallable(functions, "getMovies");
const getCinemas = httpsCallable(functions, "getCinemas");

const MovieScreeningPage: React.FC = () => {
  const [movieScreenings, setMovieScreenings] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovieScreening, setEditingMovieScreening] = useState<any | null>(null);
  const [form] = Form.useForm();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);

  const fetchMovieScreenings = async () => {
    const res: any = await getMovieScreenings();
    if (res.data.status === "success") {
      setMovieScreenings(res.data.movieScreenings);
    }
  };

  useEffect(() => {
    fetchMovieScreenings();
    getMovies().then((res: any) => setMovies(res.data.movies || []));
    getCinemas().then((res: any) => setCinemas(res.data.cinemas || []));
  }, []);

  const handleAdd = () => {
    setEditingMovieScreening(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingMovieScreening(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteMovieScreening({ id });
    message.success("Movie screening deleted");
    fetchMovieScreenings();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingMovieScreening) {
        await updateMovieScreening({ id: editingMovieScreening.id, ...values });
        message.success("Movie screening updated");
      } else {
        await createMovieScreening(values);
        message.success("Movie screening created");
      }
      setIsModalOpen(false);
      fetchMovieScreenings();
    } catch (error) {
      message.error("Error saving movie screening");
    }
  };

  const columns = [
    {
      title: "Movie",
      dataIndex: "movieId",
      key: "movieId",
      render: (id: string) => movies.find((m) => m.id === id)?.title || id,
    },
    {
      title: "Cinema",
      dataIndex: "cinemaId",
      key: "cinemaId",
      render: (id: string) => cinemas.find((c) => c.id === id)?.name || id,
    },
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Hall", dataIndex: "hall", key: "hall" },
    { title: "Ticket Count", dataIndex: "tickedCount", key: "tickedCount" },
    {
      title: "Action",
      key: "action",
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
        Add Movie Screening
      </Button>
      <Table dataSource={movieScreenings} columns={columns} rowKey="id" />
      <Modal
        title={editingMovieScreening ? "Edit Movie Screening" : "Add Movie Screening"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="movieId" label="Movie" rules={[{ required: true }]}>
            <Select options={movies.map((m) => ({ label: m.title, value: m.id }))} />
          </Form.Item>
          <Form.Item name="cinemaId" label="Cinema" rules={[{ required: true }]}>
            <Select options={cinemas.map((c) => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker showTime />
          </Form.Item>
          <Form.Item name="hall" label="Hall" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="tickedCount" label="Ticket Count" rules={[{ required: true, type: "number", min: 0 }]}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MovieScreeningPage;
