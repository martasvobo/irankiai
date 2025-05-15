import React, { useEffect, useState } from "react";
import { Button, Modal, Form, Input, Table, Space, message } from "antd";
import { Cinema } from "../types/cinema";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";

const getCinemas = httpsCallable(functions, "getCinemas");
const createCinema = httpsCallable(functions, "createCinema");
const updateCinema = httpsCallable(functions, "updateCinema");
const deleteCinema = httpsCallable(functions, "deleteCinema");

const initialCinema: Partial<Cinema & { id?: string }> = {
  name: "",
  address: "",
  email: "",
};

const CinemasPage: React.FC = () => {
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCinema, setEditingCinema] = useState<any | null>(null);
  const [form] = Form.useForm();

  const fetchCinemas = async () => {
    const res: any = await getCinemas();
    if (res.data.status === "success") {
      setCinemas(res.data.cinemas);
    }
  };

  useEffect(() => {
    fetchCinemas();
  }, []);

  const handleAdd = () => {
    setEditingCinema(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingCinema(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteCinema({ id });
    message.success("Cinema deleted");
    fetchCinemas();
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingCinema) {
        await updateCinema({ id: editingCinema.id, ...values });
        message.success("Cinema updated");
      } else {
        await createCinema(values);
        message.success("Cinema created");
      }
      setIsModalOpen(false);
      fetchCinemas();
    } catch (e) {
      // validation error
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Address", dataIndex: "address", key: "address" },
    { title: "Email", dataIndex: "email", key: "email" },
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">Cinemas</h1>
        <Button type="primary" onClick={handleAdd} className="mb-6 w-full">
          Add Cinema
        </Button>
        <Table rowKey="id" dataSource={cinemas} columns={columns} pagination={{ pageSize: 6 }} className="mb-4" />
      </div>
      <Modal
        title={editingCinema ? "Edit Cinema" : "Add Cinema"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleModalOk} className="pt-4">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter the name" }]}
            className="mb-4"
          >
            <Input size="large" />
          </Form.Item>
          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: "Please enter the address" }]}
            className="mb-4"
          >
            <Input size="large" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter the email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
            className="mb-6"
          >
            <Input size="large" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsModalOpen(false)} className="mr-2">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingCinema ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CinemasPage;
