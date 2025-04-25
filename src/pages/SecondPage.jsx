import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Table, Card, Typography, Switch, message } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, FileExcelOutlined } from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const { Title } = Typography;

function SecondPage() {
  const [inputValue, setInputValue] = useState('');
  const [entriesData, setEntriesData] = useState({});
  const [sortiesData, setSortiesData] = useState({});
  const [isEntries, setIsEntries] = useState(true);
  const timerRef = useRef(null);
  const [receivedBarcode, setReceivedBarcode] = useState(null); // New state for received barcode

  // Function to fetch the latest barcode from the backend
  const fetchLatestBarcode = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/get-latest-barcode');
      if (response.ok) {
        const data = await response.json();
        if (data.barcode) {
          setReceivedBarcode(data.barcode);
          // Set the input value immediately
          setInputValue(data.barcode);
          // Automatically add the number after 0.1 seconds
          setTimeout(() => {
            addNumber(data.barcode);
          }, 100); // 0.1 seconds
        }
      } else {
        console.error('Failed to fetch latest barcode:', response.status);
      }
    } catch (error) {
      console.error('Error fetching latest barcode:', error);
    }
  };

  // Function to send a request to nullify the QR code on the server
  const nullifyQRCode = async (barcode) => {
    try {
      const response = await fetch('http://localhost:5000/api/nullify-barcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcode }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('QR code nullified on server:', data.message);
        // Optionally, you can show a success message
        // message.success('QR code successfully processed.');
      } else {
        console.error('Failed to nullify QR code:', response.status);
        // Optionally, you can show an error message
        // message.error('Failed to process QR code.');
      }
    } catch (error) {
      console.error('Error sending nullify request:', error);
      // Optionally, you can show an error message
      // message.error('Error communicating with the server.');
    }
  };

  // Fetch the latest barcode periodically
  useEffect(() => {
    const intervalId = setInterval(fetchLatestBarcode, 1000); // Fetch every 1 second

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const value = e.target.value;
      if (value && !isNaN(Number(value))) {
        addNumber(value);
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

  const addNumber = (value) => {
    const number = Number(value);

    if (!isNaN(number) && value.trim() !== '') {
      if (isEntries) {
        setEntriesData(prevData => {
          const updatedData = { ...prevData };
          updatedData[number] = (updatedData[number] || 0) + 1;
          return updatedData;
        });
      } else {
        setSortiesData(prevData => {
          const updatedData = { ...prevData };
          updatedData[number] = (updatedData[number] || 0) + 1;
          return updatedData;
        });
      }

      // Send the nullify request immediately after adding the number
      nullifyQRCode(value);

      setInputValue('');
      setReceivedBarcode(null); // Clear the received barcode after processing
    }
  };

  const handleAddNumber = () => {
    addNumber(inputValue);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const toggleState = () => {
    setIsEntries(!isEntries);
  };

  const validateAndExport = async () => {
    const dataToExport = isEntries ? entriesData : sortiesData;
    const documentTitle = isEntries ? 'BON D\'ENTRÉE' : 'BON DE SORTIE';

    const themeColor = isEntries ? { argb: 'FF1890FF' } : { argb: 'FFF40009' };
    const lightThemeColor = isEntries ? { argb: 'FFE6F7FF' } : { argb: 'FFFFECE6' };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(isEntries ? 'Entrées' : 'Sorties');

    worksheet.columns = [{ width: 20 }, { width: 20 }];
    worksheet.addRow(['']);
    const titleRow = worksheet.addRow([documentTitle]);
    titleRow.height = 24;
    worksheet.mergeCells('A2:B2');
    const titleCell = worksheet.getCell('A2');
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: lightThemeColor };
    const dateRow = worksheet.addRow([`Date: ${new Date().toLocaleDateString('fr-FR')}`]);
    worksheet.mergeCells('A3:B3');
    const dateCell = worksheet.getCell('A3');
    dateCell.font = { italic: true, size: 11 };
    dateCell.alignment = { horizontal: 'center' };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    worksheet.addRow(['']);
    const headerRow = worksheet.addRow(['Produit', 'Nombre']);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: themeColor };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
    let rowIndex = 0;
    Object.entries(dataToExport).forEach(([number, count]) => {
      const dataRow = worksheet.addRow([Number(number), count]);
      const isEven = rowIndex % 2 === 0;
      const rowColor = isEven ? { argb: 'FFF9F9F9' } : { argb: 'FFFFFFFF' };
      dataRow.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: rowColor };
        cell.border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
      });
      rowIndex++;
    });
    worksheet.addRow(['']);
    const totalValue = Object.values(dataToExport).reduce((sum, count) => sum + count, 0);
    const totalRow = worksheet.addRow(['Total', totalValue]);
    const totalLabelCell = totalRow.getCell(1);
    totalLabelCell.font = { bold: true, size: 12 };
    totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };
    totalLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
    totalLabelCell.border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } };
    const totalValueCell = totalRow.getCell(2);
    totalValueCell.font = { bold: true, size: 12, color: themeColor };
    totalValueCell.alignment = { horizontal: 'center', vertical: 'middle' };
    totalValueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
    totalValueCell.border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'medium' } };
    const bonFileName = isEntries ? 'bon_d_entree.xlsx' : 'bon_de_sortie.xlsx';
    const bonBuffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([bonBuffer]), bonFileName);
    message.success(`Le ${documentTitle} a été exporté vers Excel avec succès !`);

    // --- Send data to the server to update transaction log ---
    for (const [product, quantity] of Object.entries(dataToExport)) {
      try {
        const response = await fetch('http://localhost:5000/api/update-log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: isEntries ? 'Entrée' : 'Sortie',
            product: Number(product),
            quantity: quantity,
          }),
        });

        if (!response.ok) {
          console.error('Échec de la mise à jour du journal des transactions sur le serveur :', response.status);
          message.error('Échec de la mise à jour du journal des transactions sur le serveur.');
          return;
        }

        const result = await response.json();
        message.success(result.message);

      } catch (error) {
        console.error('Erreur lors de l\'envoi des données au serveur :', error);
        message.error('Erreur de communication avec le serveur.');
        return;
      }
    }

    setEntriesData({});
    setSortiesData({});
  };

  const currentData = isEntries ? entriesData : sortiesData;
  const tableData = Object.entries(currentData).map(([number, count], index) => ({
    key: index,
    number: Number(number),
    count: count
  }));

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'number',
      key: 'number',
      sorter: (a, b) => a.number - b.number,
    },
    {
      title: isEntries ? 'Nombre d\'entrées' : 'Nombre de sorties',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
    }
  ];

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} className="page-title"></Title>

        <div className="toggle-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: !isEntries ? '#F40009' : 'gray' }}>Sorties</span>
          <Switch
            checked={isEntries}
            onChange={toggleState}
            checkedChildren={<ImportOutlined />}
            unCheckedChildren={<ExportOutlined />}
            style={{ backgroundColor: isEntries ? '#1890ff' : '#F40009' }}
          />
          <span style={{ color: isEntries ? '#1890ff' : 'gray' }}>Entrées</span>
        </div>
      </div>

      <Card className="input-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Input
            placeholder={isEntries ? "Entrez un nombre pour les Entrées" : "Entrez un nombre pour les Sorties"}
            value={inputValue}
            onChange={handleInputChange}
            onPressEnter={handleAddNumber}
            type="number"
            style={{ flex: 1 }}
            autoFocus
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddNumber}
            style={{ backgroundColor: isEntries ? '#1890ff' : '#F40009', borderColor: isEntries ? '#1890ff' : '#F40009' }}
          >
            Ajouter {isEntries ? 'Entrée' : 'Sortie'}
          </Button>
        </div>

      </Card>

      <Card className="table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            {isEntries ? 'Données des Entrées' : 'Données des Sorties'}
          </Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              {isEntries ?
                `Total des Entrées : ${Object.values(entriesData).reduce((sum, count) => sum + count, 0)}` :
                `Total des Sorties : ${Object.values(sortiesData).reduce((sum, count) => sum + count, 0)}`
              }
            </div>

            {/* Validate/export button */}
            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={validateAndExport}
              style={{
                backgroundColor: '#52c41a',
                borderColor: '#52c41a'
              }}
            >
              Valider
            </Button>
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          locale={{ emptyText: `Aucune ${isEntries ? 'entrée' : 'sortie'} ajoutée pour l'instant` }}
        />
      </Card>
    </div>
  );
}

export default SecondPage;