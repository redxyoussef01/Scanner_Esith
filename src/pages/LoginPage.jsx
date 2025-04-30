import React, { useState } from 'react';
import { Form, Input, Button, message, Card, Typography, Modal } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const allowedUsers = {
  'super admin': 'password', // Replace 'password' with actual hashed passwords
  'admin': 'password',
  'user': 'password',
};

const cocaColaRed = '#E30613';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [errorModalVisible, setErrorModalVisible] = useState(false); // State for error modal

  const onFinish = (values) => {
    const { username, password } = values;
    if (allowedUsers[username] && allowedUsers[username] === password) {
      message.success(`Connexion réussie en tant que ${username}`);

      // Determine user role based on username
      let userRole = 'user'; // Default role
      if (username === 'admin' || username === 'super admin') {
        userRole = 'admin';
      }

      // Store username and role in localStorage
      localStorage.setItem('currentUser', username);
      localStorage.setItem('userRole', userRole);
      console.log('User logged in:', username, 'with role:', userRole);

      // Redirect to home page
      navigate('/');
    } else {
      // Show error modal
      setErrorModalVisible(true);
    }
  };

  const handleOk = () => {
    setErrorModalVisible(false); // Close modal on OK
  };

  return (
    <div
      className="login-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: cocaColaRed,
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 450,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderRadius: '12px',
        }}
      >
        <Typography.Title level={1} style={{ textAlign: 'center', marginBottom: 24, color: cocaColaRed }}>
          CBGS
        </Typography.Title>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          Se Connecter
        </Typography.Title>
        <Form
          name="login-form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Veuillez saisir votre nom d\'utilisateur !' }]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="Nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Veuillez saisir votre mot de passe !' }]}
          >
            <Input
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: '100%', backgroundColor: '#1890ff', borderColor: '#1890ff', fontSize: '16px', padding: '10px 0' }}
              size="large"
            >
              Se Connecter
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Modal
        title="Erreur de connexion"
        visible={errorModalVisible}
        onOk={handleOk}
        okText="OK"
      >
        <p>Nom d'utilisateur ou mot de passe incorrect.</p>
      </Modal>
    </div>
  );
}

export default LoginPage;
