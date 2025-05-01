import React, { useState, useEffect } from 'react';
 import axios from 'axios';
 import { Input, Button, Table, Card, Typography, Modal } from 'antd';
 import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

 const { Title } = Typography;

 function GestionInventaireProduits() {
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info'); // 'success' or 'error'

  // Récupérer les données d'inventaire au montage du composant
  useEffect(() => {
  fetchInventoryData();
  }, []);

  // Fonction pour récupérer les données d'inventaire
  const fetchInventoryData = async () => {
  setLoading(true);
  try {
  const response = await axios.get('http://51.83.99.192:5000/api/inventory');
  // Filter out the row with productId "ProductID"
  const filteredData = response.data.filter(item => item.productId !== 'ProductID');
  setInventoryData(filteredData);
  setLoading(false);
  } catch (error) {
  console.error('Erreur lors de la récupération des données d\'inventaire :', error);
  setModalType('error');
  setModalMessage('Échec du chargement des données d\'inventaire');
  setModalVisible(true);
  setLoading(false);
  }
  };

  // Fonction pour ajouter/mettre à jour un produit
  const handleAddProduct = async () => {
  // Valider les entrées
  if (!productId.trim()) {
  setModalType('error');
  setModalMessage('L\'ID du produit est requis');
  setModalVisible(true);
  return;
  }

  if (!productName.trim()) {
  setModalType('error');
  setModalMessage('Le nom du produit est requis');
  setModalVisible(true);
  return;
  }

  const quantityNum = Number(quantity);
  if (isNaN(quantityNum) || quantityNum < 0) {
  setModalType('error');
  setModalMessage('La quantité doit être un nombre positif valide');
  setModalVisible(true);
  return;
  }

  try {
  await axios.post('http://51.83.99.192:5000/api/inventory', {
  productId: productId.trim(),
  name: productName.trim(),
  quantity: quantityNum
  });

  setModalType('success');
  setModalMessage('Produit ajouté/mis à jour avec succès');
  setModalVisible(true);
  setProductId('');
  setProductName('');
  setQuantity('');
  fetchInventoryData(); // Rafraîchir les données
  } catch (error) {
  console.error('Erreur lors de l\'ajout du produit :', error);
  setModalType('error');
  setModalMessage('Échec de l\'ajout du produit');
  setModalVisible(true);
  }
  };

  const handleModalOk = () => {
  setModalVisible(false);
  };

  // Configuration des colonnes du tableau
  const columns = [
  {
  title: 'ID Produit',
  dataIndex: 'productId',
  key: 'productId',
  },
  {
  title: 'Nom du Produit',
  dataIndex: 'name',
  key: 'name',
  },
  {
  title: 'Quantité',
  dataIndex: 'quantity',
  key: 'quantity',
  sorter: (a, b) => a.quantity - b.quantity,
  },
  {
  title: 'Transactions du Jour',
  dataIndex: 'dailyTransactions',
  key: 'dailyTransactions',
  sorter: (a, b) => a.dailyTransactions - b.dailyTransactions,
  },
  ];

  return (
  <div style={{ padding: '20px' }}>
  <Title level={2}>Gestion de l'Inventaire des Produits</Title>

  {/* Formulaire d'entrée */}
  <Card style={{ marginBottom: '20px' }}>
  <div style={{ display: 'flex', gap: '10px' }}>
  <Input
  placeholder="ID Produit"
  value={productId}
  onChange={(e) => setProductId(e.target.value)}
  style={{ flexGrow: 1 }}
  />
  <Input
  placeholder="Nom du Produit"
  value={productName}
  onChange={(e) => setProductName(e.target.value)}
  style={{ flexGrow: 1 }}
  />
  <Input
  placeholder="Quantité"
  type="number"
  min={0}
  value={quantity}
  onChange={(e) => setQuantity(e.target.value)}
  style={{ flexGrow: 1 }}
  />
  <Button
  type="primary"
  icon={<PlusOutlined />}
  onClick={handleAddProduct}
  >
  Ajouter/Mettre à jour le Produit
  </Button>
  </div>
  </Card>

  {/* Tableau d'inventaire */}
  <Card>
  <Title level={4}>Inventaire Actuel</Title>
  <Table
  columns={columns}
  dataSource={inventoryData}
  rowKey="productId"
  loading={loading}
  pagination={{ pageSize: 10 }}
  />
  </Card>

  {/* Modal de message */}
  <Modal
  title={modalType === 'success' ? 'Succès' : 'Erreur'}
  visible={modalVisible}
  onOk={handleModalOk}
  onCancel={handleModalOk}
  >
  <p>{modalMessage}</p>
  </Modal>
  </div>
  );
 }

 export default GestionInventaireProduits;