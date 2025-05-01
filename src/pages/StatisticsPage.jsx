import React, { useState, useEffect } from 'react';
 import { Card, Typography, Select, DatePicker, Row, Col, message } from 'antd';
 import axios from 'axios';
 import moment from 'moment';
 import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
 import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';

 const { Title } = Typography;
 const { Option } = Select;
 const { RangePicker } = DatePicker;

 function StatisticsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedDates, setSelectedDates] = useState(null);
  const [uniqueProductsList, setUniqueProductsList] = useState([]); // State for unique products

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    // Calculate unique products *after* transactions are fetched and filtered
    if (transactions.length > 0) {
      const products = [...new Set(transactions.map(t => t.product))];
      setUniqueProductsList(products);
    }
  }, [transactions]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://51.83.99.192:5000/api/transaction-log');
      // Filter out transactions where product is 'Produit'
      const filteredData = response.data.filter(item => item.product !== 'Produit');
      setTransactions(filteredData);
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
  const totalEntries = filteredTransactions.filter(t => t.type === 'Entree').reduce((sum, t) => sum + t.quantity, 0);
  const totalSorties = filteredTransactions.filter(t => t.type === 'Sortie').reduce((sum, t) => sum + t.quantity, 0);

  const handleProductChange = (value) => {
    setSelectedProduct(value);
  };

  const handleDateChange = (dates) => {
    setSelectedDates(dates);
  };

  // Prepare data for Top 5 Produits en Transaction Pie Chart
  const top5TransactionProductsData = () => {
    const productTransactionCounts = {};
    filteredTransactions.forEach(t => {
      productTransactionCounts[t.product] = (productTransactionCounts[t.product] || 0) + 1;
    });

    const sortedProducts = Object.entries(productTransactionCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5)
      .map(([product, count]) => ({ name: `Produit ${product}`, count }));

    return sortedProducts;
  };

  const top5PieData = top5TransactionProductsData();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  // Prepare data for Transaction Type Bar Chart
  const transactionTypeData = [
    { name: 'Entrees', value: filteredTransactions.filter(t => t.type === 'Entree').length },
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
              {uniqueProductsList.map((product) => (
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
          <Card title="Top 5 Produits en transaction">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={top5PieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    value,
                    index
                  }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = 25 + innerRadius + (outerRadius - innerRadius);
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill={COLORS[index % COLORS.length]}
                        textAnchor={x > cx ? "start" : "end"}
                        dominantBaseline="central"
                      >
                        {top5PieData[index]?.name} ({value})
                      </text>
                    );
                  }}
                >
                  {top5PieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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