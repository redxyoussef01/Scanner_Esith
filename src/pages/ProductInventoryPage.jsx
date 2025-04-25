import React, { useState, useEffect } from 'react';
import { Input, Button, Table, Card, Typography, message } from 'antd';
import { PlusOutlined, FileExcelOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

function ProductInventoryPage() {
  const [documentInventaire, setDocumentInventaire] = useState('');
  const [magazin, setMagazin] = useState('');
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleAddProduct = async () => {
    if (!documentInventaire || !magazin) {
      message.error('Le Document Inventaire et le Magazin sont requis.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/add-inventory', {
        documentInventaire: documentInventaire,
        magazin: parseInt(magazin, 10), // Ensure magazin is a number
      });
      message.success(response.data.message);
      setDocumentInventaire('');
      setMagazin('');
      fetchInventoryData(); // Refresh the table
    } catch (err) {
      message.error(`Échec de l'ajout du produit : ${err.message}`);
      console.error('Erreur lors de l\'ajout du produit :', err);
    }
  };

  const fetchInventoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/inventory-data');
      setInventoryData(response.data);
    } catch (err) {
      setError(err.message);
      message.error(`Échec du chargement des données d'inventaire : ${err.message}`);
      console.error('Erreur lors de la récupération des données d\'inventaire :', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const colonnes = [
    {
      title: 'Document Inventaire',
      dataIndex: 'documentInventaire',
      key: 'documentInventaire',
    },
    {
      title: 'Magazin (Qté)',
      dataIndex: 'magazin',
      key: 'magazin',
      sorter: (a, b) => a.magazin - b.magazin,
    },
    // You can add more columns here if you decide to store more data
  ];

  if (loading) {
    return <div className="page-container">Chargement des données d'inventaire...</div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <Typography.Text type="error">Erreur lors du chargement des données d'inventaire : {error}</Typography.Text>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Title level={2} className="page-title">Inventaire des Produits</Title>

      <Card className="input-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: 16 }}>
          <Input
            placeholder="Document Inventaire (ID)"
            value={documentInventaire}
            onChange={(e) => setDocumentInventaire(e.target.value)}
          />
          <Input
            placeholder="Magazin (Quantité)"
            type="number"
            value={magazin}
            onChange={(e) => setMagazin(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProduct}>
            Ajouter un Produit
          </Button>
        </div>
      </Card>

      <Card className="table-card">
        <Title level={4} style={{ margin: 0, marginBottom: 16 }}>
          Données d'Inventaire
        </Title>
        <Table columns={colonnes} dataSource={inventoryData} pagination={false} rowKey="documentInventaire" locale={{ emptyText: 'Aucune donnée d\'inventaire disponible' }} />
      </Card>
    </div>
  );
}

export default ProductInventoryPage;