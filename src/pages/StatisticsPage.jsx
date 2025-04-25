import React, { useState, useEffect } from 'react';
import { Card, Typography, Select, DatePicker, Row, Col, message } from 'antd';
import axios from 'axios';
import moment from 'moment';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart, Bar } from 'recharts';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

function StatisticsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedDates, setSelectedDates] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/transaction-log');
      setTransactions(response.data);
    } catch (err) {
      setError(err.message);
      message.error(`Erreur lors du chargement des transactions : ${err.message}`);
      console.error('Erreur lors de la récupération des transactions :', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransactions = () => {
    return transactions.filter((transaction) => {
      const productMatch = !selectedProduct || transaction.product === selectedProduct;
      const dateMatch =
        !selectedDates ||
        (moment(transaction.timestamp).isSameOrAfter(selectedDates[0], 'day') &&
          moment(transaction.timestamp).isSameOrBefore(selectedDates[1], 'day'));
      return productMatch && dateMatch;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  const totalEntries = filteredTransactions.filter(t => t.type === 'Entrée').reduce((sum, t) => sum + t.quantity, 0);
  const totalSorties = filteredTransactions.filter(t => t.type === 'Sortie').reduce((sum, t) => sum + t.quantity, 0);
  const uniqueProducts = [...new Set(transactions.map(t => t.product))];

  const handleProductChange = (value) => {
    setSelectedProduct(value);
  };

  const handleDateChange = (dates) => {
    setSelectedDates(dates);
  };

  // Prepare data for Stock Quantity Line Chart
  const stockQuantityData = uniqueProducts.map(product => {
    const productTransactions = filteredTransactions.filter(t => t.product === product);
    let currentStock = 0;
    const timelineData = productTransactions
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(t => {
        if (t.type === 'Entrée') {
          currentStock += t.quantity;
        } else {
          currentStock -= t.quantity;
        }
        return { timestamp: moment(t.timestamp).format('YYYY-MM'), stock: currentStock };
      });

    // Group data by month and year to avoid duplicate timestamps
    const groupedData = timelineData.reduce((acc, curr) => {
      if (!acc[curr.timestamp]) {
        acc[curr.timestamp] = { timestamp: curr.timestamp, stock: curr.stock };
      } else {
        acc[curr.timestamp].stock = curr.stock; // Keep the latest stock value for the month
      }
      return acc;
    }, {});

    return { name: `Produit ${product}`, data: Object.values(groupedData) };
  });

  // Prepare data for Transaction Type Bar Chart
  const transactionTypeData = [
    { name: 'Entrées', value: filteredTransactions.filter(t => t.type === 'Entrée').length },
    { name: 'Sorties', value: filteredTransactions.filter(t => t.type === 'Sortie').length },
  ];

  if (loading) {
    return <div className="page-container">Chargement des statistiques...</div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <Typography.Text type="error">Erreur lors du chargement des statistiques : {error}</Typography.Text>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Title level={2} className="page-title">Statistiques</Title>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Select
              placeholder="Filtrer par Produit"
              onChange={handleProductChange}
              style={{ width: '100%' }}
              allowClear
            >
              {uniqueProducts.map((product) => (
                <Option key={product} value={product}>
                  Produit {product}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={12}>
            <RangePicker onChange={handleDateChange} style={{ width: '100%' }} />
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="Total des Entrées">
            <Typography.Title level={3}>{totalEntries}</Typography.Title>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Total des Sorties">
            <Typography.Title level={3}>{totalSorties}</Typography.Title>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Quantité en Stock au Fil du Temps">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                {stockQuantityData.length > 0 ? (
                  stockQuantityData.map(productData => (
                    <Line
                      key={productData.name}
                      type="monotone"
                      data={productData.data}
                      dataKey="stock"
                      name={productData.name}
                      stroke={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
                      dot={{ r: 5 }}
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  ))
                ) : (
                  <Line type="monotone" data={[]} /> // Render an empty line if no data
                )}
              </LineChart>
            </ResponsiveContainer>
            {stockQuantityData.length === 0 && (
              <Typography.Text>Aucune donnée de stock disponible pour les filtres sélectionnés.</Typography.Text>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Types de Transactions">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transactionTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default StatisticsPage;