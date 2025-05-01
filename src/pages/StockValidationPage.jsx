import React, { useState, useEffect, useRef } from 'react';
 import { Input, Button, Table, Card, Typography, message } from 'antd';
 import { CheckCircleOutlined, FileExcelOutlined } from '@ant-design/icons';
 import ExcelJS from 'exceljs';
 import { saveAs } from 'file-saver';

 const { Title } = Typography;

 function StockValidationPage() {
  const [inputValue, setInputValue] = useState('');
  const [validatedQuantities, setValidatedQuantities] = useState({}); // { productId: count }
  const timerRef = useRef(null);
  const [receivedBarcode, setReceivedBarcode] = useState(null);
  const [inventoryData, setInventoryData] = useState([]); // Array of inventory objects { productId, name, quantity }

  // Function to fetch the latest barcode from the backend
  const fetchLatestBarcode = async () => {
    try {
      const response = await fetch('http://51.83.99.192:5000/api/get-latest-barcode');
      if (response.ok) {
        const data = await response.json();
        if (data.barcode && data.barcode !== receivedBarcode) {
          console.log("Received new barcode:", data.barcode);
          setReceivedBarcode(data.barcode);
          setInputValue(data.barcode);
          setTimeout(() => {
            validateProduct(data.barcode);
          }, 100);
        }
      } else {
        console.error('Failed to fetch latest barcode:', response.status);
      }
    } catch (error) {
      // console.error('Error fetching latest barcode:', error);
    }
  };

  // Function to send a request to nullify the QR code on the server
  const nullifyQRCode = async (barcode) => {
    try {
      console.log("Nullifying barcode:", barcode);
      const response = await fetch('http://51.83.99.192:5000/api/nullify-barcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcode }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('QR code nullified on server:', data.message);
        setReceivedBarcode(null);
      } else {
        console.error('Failed to nullify QR code:', response.status);
        message.error(`Failed to nullify barcode ${barcode} on server.`);
      }
    } catch (error) {
      console.error('Error sending nullify request:', error);
      message.error(`Error communicating with server to nullify barcode ${barcode}.`);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(fetchLatestBarcode, 1000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receivedBarcode]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch('http://51.83.99.192:5000/api/inventory');
        if (response.ok) {
          const data = await response.json();
          // Filter out the row with productId "ID Produit"
          const filteredData = data.filter(item => item.productId !== 'ProductID');
          setInventoryData(filteredData);
        } else {
          console.error('Failed to fetch inventory:', response.status);
          message.error('Failed to fetch inventory.');
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
        message.error('Error fetching inventory.');
      }
    };
    fetchInventory();
  }, []);

  const handleInputChange = (e) => {
    const currentValue = e.target.value;
    setInputValue(currentValue);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (currentValue.trim() !== '') {
        validateProduct(currentValue.trim());
      }
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const validateProduct = (value) => {
    const productId = String(value).trim();

    if (productId === '') {
      return;
    }

    const productInInventory = inventoryData.find(item => String(item.productId) === productId);

    if (!productInInventory) {
      message.error(`Product ID "${productId}" not found in inventory.`);
      setInputValue('');
      if (productId === receivedBarcode) {
        nullifyQRCode(productId);
      } else {
        setReceivedBarcode(null);
      }
      return;
    }

    setValidatedQuantities(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
    message.success(`Product ${productId} validated.`);
    setInputValue('');

    if (productId === receivedBarcode) {
      nullifyQRCode(productId);
    } else {
      setReceivedBarcode(null);
    }
  };

  const handleValidateManually = () => {
    validateProduct(inputValue);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const exportValidatedStock = async () => {
    if (inventoryData.length === 0) {
      message.warn('No inventory data to export.');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory Validation');

    // Define columns
    worksheet.columns = [
      { header: 'Produit ID', key: 'productId', width: 15 },
      { header: 'Nom Produit', key: 'name', width: 25 },
      { header: 'Stock Inventaire', key: 'inventoryStock', width: 15 },
      { header: 'Quantité Validée', key: 'validatedQuantity', width: 15 },
      { header: 'Différence', key: 'difference', width: 12 },
    ];

    // Add data rows for all inventory items, excluding the header row
    inventoryData.forEach(item => {
      if (item.productId !== 'ID Produit') {
        const validatedQty = validatedQuantities[item.productId] || 0;
        const difference = item.quantity - validatedQty;
        worksheet.addRow({
          productId: item.productId,
          name: item.name,
          inventoryStock: item.quantity,
          validatedQuantity: validatedQty,
          difference: difference,
        });
      }
    });

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }, // Light gray background
      };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF000000' } }, // Thin black bottom border
      };
    });

    // Style data rows
    worksheet.eachRow({ start: 2 }, (row) => {
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle' };
      });
    });

    // Add auto-width for columns based on content
    worksheet.columns.forEach((column) => {
      column.width = undefined;
    });
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: worksheet.actualRowCount, column: worksheet.columns.length },
    };

    const today = new Date().toISOString().split('T')[0];
    const filename = `inventory_validation_${today}.xlsx`;

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
      message.success(`Inventory validation exported to ${filename}!`);
      setValidatedQuantities({}); // Optionally clear validated quantities after export
    } catch (error) {
      console.error('Error exporting Excel:', error);
      message.error('Failed to export inventory validation to Excel.');
    }
  };

  const tableData = inventoryData
    .filter(item => item.productId !== 'ID Produit')
    .map(item => ({
      key: item.productId,
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      validatedCount: validatedQuantities[item.productId] || 0,
      difference: (item.quantity - (validatedQuantities[item.productId] || 0)),
    }));

  const columns = [
    {
      title: 'ID Produit',
      dataIndex: 'productId',
      key: 'productId',
      sorter: (a, b) => a.productId.localeCompare(b.productId),
      ellipsis: true,
    },
    {
      title: 'Nom du Produit',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      ellipsis: true,
    },
    {
      title: 'Stock Inventaire',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Quantité Validée',
      dataIndex: 'validatedCount',
      key: 'validatedCount',
      align: 'right',
    },
    {
      title: 'Différence',
      dataIndex: 'difference',
      key: 'difference',
      align: 'right',
    },
  ];

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={2} className="page-title">Validation du Stock</Title>
      </div>

      <Card className="input-card" style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Input
            placeholder="Scanner ou entrer l'ID du produit à valider"
            value={inputValue}
            onChange={handleInputChange}
            onPressEnter={handleValidateManually}
            type="text"
            style={{ flex: '1', minWidth: '250px' }}
            autoFocus
          />
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleValidateManually}
          >
            Valider
          </Button>
        </div>
      </Card>

      <Card className="table-card" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: '10px' }}>
          <Title level={4} style={{ margin: 0 }}>
            Inventaire des Produits
          </Title>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={exportValidatedStock}
            disabled={inventoryData.length === 0} // Disable if no inventory data
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Exporter l'Inventaire Validé
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          size="small"
          rowKey="productId"
          locale={{ emptyText: 'Aucun produit dans l\'inventaire' }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
 }

 export default StockValidationPage;