import React, { useState } from 'react';
import { Form, Input, Button, message, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const allowedUsers = {
  'super admin': 'password', // Replace 'password' with actual hashed passwords
  'admin': 'password',
  'user': 'password',
};

const cocaColaRed = '#E30613';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const onFinish = (values) => {
    const { username, password } = values;
    if (allowedUsers[username] && allowedUsers[username] === password) {
      message.success(`Connexion réussie en tant que ${username}`);
      onLogin(username); // Pass the username/role to the parent Layout
      navigate('/'); // Redirect to the home page
    } else {
      message.error('Nom d\'utilisateur ou mot de passe incorrect.');
    }
  };

  return (
    <div
      className="login-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: cocaColaRed, // Coca-Cola red background
        padding: '20px', // Add some padding for responsiveness
      }}
    >
      <Card
        style={{
          width: '100%', // Make card responsive
          maxWidth: 450, // Increased maximum width
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', // More pronounced shadow
          borderRadius: '12px', // More rounded corners
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
              size="large" // Increase input size
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
              size="large" // Increase input size
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: '100%', backgroundColor: '#1890ff', borderColor: '#1890ff', fontSize: '16px', padding: '10px 0' }} // Style the button
              size="large" // Increase button size
            >
              Se Connecter
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default LoginPage;