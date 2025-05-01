import React, { useState, useEffect } from 'react';
 import { Table, Card, Typography, message } from 'antd';
 import axios from 'axios';

 const { Title } = Typography;

 function HistoryPage() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://51.83.99.192:5173/api/transaction-log');
        // Filter out transactions where product is 'Produit'
        const filteredData = response.data.filter(item => item.product !== 'Produit');
        setHistoryData(filteredData);
      } catch (err) {
        setError(err.message);
        message.error(`Erreur lors du chargement de l'historique : ${err.message}`);
        console.error('Erreur lors de la récupération de l\'historique des transactions :', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const colonnes = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'Entrée', value: 'Entrée' },
        { text: 'Sortie', value: 'Sortie' },
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Produit',
      dataIndex: 'product',
      key: 'product',
      sorter: (a, b) => a.product - b.product,
    },
    {
      title: 'Quantité',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Horodatage',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => new Date(timestamp).toLocaleString('fr-FR'),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      defaultSortOrder: 'descend',
    },
  ];

  if (loading) {
    return <div className="page-container">Chargement des données de l'historique...</div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <Typography.Text type="error">Erreur lors du chargement de l'historique : {error}</Typography.Text>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Title level={2} className="page-title">Historique des Transactions</Title>
      <Card className="table-card">
        <Table
          columns={colonnes}
          dataSource={historyData}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Aucun historique de transaction disponible' }}
        />
      </Card>
    </div>
  );
 }

 export default HistoryPage;