import { Button, DatePicker, Form, Input, message, Modal, Select, Space, Table } from "antd";
import { httpsCallable } from "firebase/functions";
import React, { useEffect, useState } from "react";
import { functions, auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Cinema } from "../types/cinema";
import { Movie } from "../types/movie";
import dayjs from "dayjs";

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
  const [currentCinemaId, setCurrentCinemaId] = useState<string | null | undefined>(undefined);

  const fetchMovieScreenings = async (cinemaIdToUse: string) => {
    const res: any = await getMovieScreenings();
    if (res.data.status === "success") {
      setMovieScreenings(res.data.movieScreenings.filter((s: any) => s.cinemaId === cinemaIdToUse));
    }
  };

  useEffect(() => {
    // Get current user's cinemaId
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setCurrentCinemaId(userDoc.data().cinemaId);
        } else {
          setCurrentCinemaId(null);
        }
      } else {
        setCurrentCinemaId(null);
      }
    });
    getMovies().then((res: any) => setMovies(res.data.movies || []));
    getCinemas().then((res: any) => setCinemas(res.data.cinemas || []));
    return () => unsubscribe();
  }, []);

  // Fetch screenings only after cinemaId is loaded and valid
  useEffect(() => {
    if (typeof currentCinemaId === "string" && currentCinemaId) {
      fetchMovieScreenings(currentCinemaId);
    } else if (currentCinemaId === null) {
      setMovieScreenings([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCinemaId]);

  const handleAdd = () => {
    setEditingMovieScreening(null);
    form.resetFields();
    if (currentCinemaId) {
      form.setFieldsValue({ cinemaId: currentCinemaId });
    }
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    // Convert date to Dayjs for DatePicker compatibility
    let dateValue = record.date;
    if (dateValue && typeof dateValue === "object" && typeof dateValue.seconds === "number") {
      dateValue = dayjs(dateValue.seconds * 1000);
    } else if (dateValue && typeof dateValue === "object" && dateValue.$d) {
      dateValue = dayjs(dateValue.$d);
    } else if (typeof dateValue === "string" || dateValue instanceof Date) {
      dateValue = dayjs(dateValue);
    }
    setEditingMovieScreening(record);
    form.setFieldsValue({ ...record, date: dateValue, cinemaId: record.cinemaId });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteMovieScreening({ id });
    message.success("Movie screening deleted");
    if (currentCinemaId) {
      fetchMovieScreenings(currentCinemaId);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      // Always use currentCinemaId for cinemaId
      const finalValues = { ...values, cinemaId: currentCinemaId };
      if (editingMovieScreening) {
        await updateMovieScreening({ id: editingMovieScreening.id, ...finalValues });
        message.success("Movie screening updated");
      } else {
        await createMovieScreening(finalValues);
        message.success("Movie screening created");
      }
      setIsModalOpen(false);
      if (currentCinemaId) {
        fetchMovieScreenings(currentCinemaId);
      }
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
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: any) => {
        // Firestore Timestamp
        if (date && typeof date === "object" && typeof date.seconds === "number") {
          return new Date(date.seconds * 1000).toLocaleString();
        }
        // Dayjs/Moment with $d
        if (date && typeof date === "object" && date.$d) {
          return new Date(date.$d).toLocaleString();
        }
        // ISO string or Date
        if (typeof date === "string" || date instanceof Date) {
          return new Date(date).toLocaleString();
        }
        return "";
      },
    },
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">Movie Screenings</h1>
        <Button type="primary" onClick={handleAdd} className="mb-6 w-full">
          Add Movie Screening
        </Button>
        <Table
          dataSource={movieScreenings}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 6 }}
          className="mb-4"
        />
      </div>
      <Modal
        title={editingMovieScreening ? "Edit Movie Screening" : "Add Movie Screening"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleModalOk} className="pt-4">
          <Form.Item name="movieId" label="Movie" rules={[{ required: true }]} className="mb-4">
            <Select options={movies.map((m) => ({ label: m.title, value: m.id }))} size="large" />
          </Form.Item>
          <Form.Item name="cinemaId" label="Cinema" rules={[{ required: true }]} className="mb-4">
            <Select
              options={cinemas.filter((c) => c.id === currentCinemaId).map((c) => ({ label: c.name, value: c.id }))}
              size="large"
              disabled
            />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]} className="mb-4">
            <DatePicker showTime className="w-full" size="large" />
          </Form.Item>
          <Form.Item name="hall" label="Hall" rules={[{ required: true }]} className="mb-4">
            <Input size="large" />
          </Form.Item>
          <Form.Item
            name="tickedCount"
            label="Ticket Count"
            rules={[{ required: true, min: 0, message: "Please enter a valid ticket count" }]}
            className="mb-6"
          >
            <Input type="number" size="large" inputMode="numeric" pattern="[0-9]*" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModalOpen(false)} className="mr-2">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingMovieScreening ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default MovieScreeningPage;
