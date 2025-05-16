import { Button, Card, Form, Input, List, Modal, Spin, Select, message } from "antd";
import "antd/dist/reset.css";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import React, { useEffect, useState } from "react";
import { auth, db, functions } from "../firebaseConfig";
import "@ant-design/v5-patch-for-react-19";

const getUsers = httpsCallable(functions, "getUsers");
const createUser = httpsCallable(functions, "createUser");
const updateUser = httpsCallable(functions, "updateUser");
const deleteUser = httpsCallable(functions, "deleteUser");
const getCinemas = httpsCallable(functions, "getCinemas");

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [form] = Form.useForm();
  const [isAdmin, setIsAdmin] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  // Fetch cinemas for cinemaWorker selection
  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const result = await getCinemas();
        setCinemas((result.data as any).cinemas || []);
      } catch (error) {
        setCinemas([]);
      }
    };
    fetchCinemas();
  }, []);

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

  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeoutMs)),
    ]);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await withTimeout(getUsers(), 10000);
        setUsers((result.data as any).users as any[]);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [messageApi]);

  const pressAddUserButton = () => {
    if (!isAdmin) {
      messageApi.error("Only admins can add users.");
      return;
    }
    setEditingUser(null);
    form.resetFields();
    setSelectedType(undefined);
    setIsModalOpen(true);
  };

  const validateDetailsAndStoreUser = async () => {
    if (!isAdmin) {
      messageApi.error("You do not have permission.");
      return;
    }
    try {
      const details = await form.validateFields();
      if (!editingUser) {
        const duplicateUser = users.find((user) => user.email === details.email);
        if (duplicateUser) {
          messageApi.error("A user with the same email already exists.");
          return;
        }
        await createUser(details);

        const { password, ...rest } = details;
        if (password) {
          await createUser({ ...rest, password });
        } else {
          await createUser(rest);
        }
        await getUsers().then((result) => {
          setUsers((result.data as any).users as any[]);
        });
        messageApi.success("User added successfully!");
      } else {
        const duplicateUser = users.find((user) => user.id !== editingUser.id && user.email === details.email);
        if (duplicateUser) {
          messageApi.error("A user with the same email already exists.");
          return;
        }
        await updateUser({ id: editingUser.id, ...details });
        await getUsers().then((result) => {
          setUsers((result.data as any).users as any[]);
        });
        messageApi.success("User updated successfully!");
      }
      setIsModalOpen(false);
    } catch (error) {
      messageApi.error("Please check the user details and try again.");
    }
  };

  const pressEditUserButton = (user: any) => {
    if (!isAdmin) {
      messageApi.error("You do not have permission to edit users.");
      return;
    }
    setEditingUser(user);
    form.setFieldsValue(user);
    setSelectedType(user.type);
    setIsModalOpen(true);
  };

  const confirmAndDeleteUser = (id: string) => {
    if (!isAdmin) {
      messageApi.error("Only admins can delete users.");
      return;
    }
    try {
      Modal.confirm({
        title: "Are you sure you want to delete this user?",
        content: "This action cannot be undone.",
        okText: "Yes",
        cancelText: "Cancel",
        onOk: async () => {
          try {
            await deleteUser({ id });
            await getUsers().then((result) => {
              setUsers((result.data as any).users as any[]);
            });
            messageApi.success("User deleted successfully!");
          } catch (err) {
            console.error("Error during deletion:", err);
            messageApi.error("Failed to delete user. Please try again.");
          }
        },
        onCancel: () => {
          console.log("Deletion canceled by the user.");
        },
      });
    } catch (error) {
      if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
        deleteUser({ id })
          .then(() => getUsers())
          .then((result) => {
            setUsers((result.data as any).users as any[]);
            messageApi.success("User deleted successfully!");
          })
          .catch((err) => {
            console.error("Error deleting user (fallback):", err);
            messageApi.error("Failed to delete user. Please try again.");
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
      <h1 className="text-2xl mb-4">Users</h1>
      {isAdmin && (
        <div className="mb-4">
          <Button type="primary" onClick={pressAddUserButton}>
            Add User
          </Button>
        </div>
      )}
      <List
        grid={{ gutter: 16, column: 4 }}
        dataSource={users}
        renderItem={(user) => (
          <List.Item>
            <Card
              title={user.username}
              actions={
                isAdmin
                  ? [
                      <Button type="link" key="edit" onClick={() => pressEditUserButton(user)}>
                        Edit
                      </Button>,
                      <Button type="link" danger key="delete" onClick={() => confirmAndDeleteUser(user.id)}>
                        Delete
                      </Button>,
                    ]
                  : []
              }
            >
              <p>Email: {user.email}</p>
              <p>Type: {user.type}</p>
              <p>Description: {user.description}</p>
              {user.cinemaId && (
                <p>Cinema: {cinemas.find((cinema) => cinema.id === user.cinemaId)?.name || user.cinemaId}</p>
              )}
            </Card>
          </List.Item>
        )}
      />
      <Modal
        title={editingUser ? "Edit User" : "Add User"}
        open={isModalOpen}
        onOk={validateDetailsAndStoreUser}
        onCancel={handleModalCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please enter the username" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter the email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input />
          </Form.Item>
          {/* Password field only for adding a new user */}
          {!editingUser && (
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Please enter the password" }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true, message: "Please select the user type" }]}>
            <Select
              onChange={(value) => {
                setSelectedType(value);
                if (value !== "cinemaWorker") {
                  form.setFieldsValue({ cinemaId: undefined });
                }
              }}
            >
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="cinemaWorker">Cinema Worker</Select.Option>
              <Select.Option value="user">User</Select.Option>
            </Select>
          </Form.Item>
          {selectedType === "cinemaWorker" && (
            <Form.Item name="cinemaId" label="Cinema" rules={[{ required: true, message: "Please select a cinema" }]}>
              <Select placeholder="Select a cinema">
                {cinemas.map((cinema) => (
                  <Select.Option key={cinema.id} value={cinema.id}>
                    {cinema.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
