import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Table, Card, Typography, Switch, message } from 'antd';
import { PlusOutlined, ImportOutlined, ExportOutlined, FileExcelOutlined } from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const { Title } = Typography;

function SecondPage() {
    const [inputValue, setInputValue] = useState('');
    const [entriesData, setEntriesData] = useState({}); // Stores { productId: count }
    const [sortiesData, setSortiesData] = useState({}); // Stores { productId: count }
    const [isEntries, setIsEntries] = useState(true);
    const timerRef = useRef(null);
    const [receivedBarcode, setReceivedBarcode] = useState(null);
    const [inventoryProducts, setInventoryProducts] = useState([]); // State to hold inventory product IDs (can be string or number)
    const [inventoryProductDetails, setInventoryProductDetails] = useState({}); // Stores { productId: name } for display/export if needed

    // Function to fetch the latest barcode from the backend
    const fetchLatestBarcode = async () => {
        try {
            const response = await fetch('http://51.83.99.192:5000/api/get-latest-barcode');
            if (response.ok) {
                const data = await response.json();
                if (data.barcode && data.barcode !== receivedBarcode) { // Process only new barcodes
                    console.log("Received new barcode:", data.barcode);
                    setReceivedBarcode(data.barcode); // Keep track of the last processed barcode
                    setInputValue(data.barcode);
                    // Automatically add after a short delay
                    setTimeout(() => {
                        addNumber(data.barcode);
                    }, 100); // Delay allows state update and potential UI feedback
                }
            } else {
                console.error('Failed to fetch latest barcode:', response.status);
            }
        } catch (error) {
            // Avoid logging frequent network errors if server is temporarily down
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
                setReceivedBarcode(null); // Clear received barcode after successful nullification
            } else {
                console.error('Failed to nullify QR code:', response.status);
                 message.error(`Failed to nullify barcode ${barcode} on server.`);
            }
        } catch (error) {
            console.error('Error sending nullify request:', error);
             message.error(`Error communicating with server to nullify barcode ${barcode}.`);
        }
    };

    // Fetch the latest barcode periodically
    useEffect(() => {
        const intervalId = setInterval(fetchLatestBarcode, 1000); // Check every second
        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [receivedBarcode]); // Re-run effect if receivedBarcode changes (helps prevent re-processing)

    // Fetch inventory products on component mount
    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await fetch('http://51.83.99.192:5000/api/inventory');
                if (response.ok) {
                    const data = await response.json(); // Expects [{ productId: 'ID1', name: 'Name1', quantity: 10 }, ...]
                    // Ensure productIds are stored correctly, even if they are numbers in Excel
                    const productIds = data.map(item => String(item.productId));
                    const productDetails = data.reduce((acc, item) => {
                        acc[String(item.productId)] = item.name || `Produit ${item.productId}`; // Use name, fallback to ID
                        return acc;
                    }, {});

                    console.log('Fetched inventory product IDs:', productIds);
                    console.log('Fetched inventory product details:', productDetails);
                    setInventoryProducts(productIds);
                    setInventoryProductDetails(productDetails);
                } else {
                    console.error('Failed to fetch inventory products:', response.status);
                    message.error('Failed to fetch inventory products.');
                }
            } catch (error) {
                console.error('Error fetching inventory products:', error);
                message.error('Error fetching inventory products.');
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

        // Set a timer to add the number automatically after a pause
        timerRef.current = setTimeout(() => {
            if (currentValue.trim() !== '') { // Check if not empty after trimming
                addNumber(currentValue.trim());
            }
        }, 1500); // Adjust delay as needed (e.g., 1.5 seconds)
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const addNumber = (value) => {
        // Ensure value is treated as a string
        const productId = String(value).trim();

        if (productId === '') {
            // message.warn('Input is empty.'); // Optional: give feedback for empty input
            return;
        }

        // Validate against the fetched inventory product IDs (now strings)
        if (!inventoryProducts.includes(productId)) {
            message.error(`Product ID "${productId}" is not a valid inventory product.`);
            setInputValue(''); // Clear the input after validation failure
             // Don't nullify if it wasn't a valid product ID recognised by the system
             // Only nullify if it was specifically the received barcode that failed validation
             if (productId === receivedBarcode) {
                 nullifyQRCode(productId); // Nullify the invalid barcode received from scanner
             } else {
                 setReceivedBarcode(null); // Clear any potentially stale barcode state
             }
            return;
        }

        // Add to the correct state (Entries or Sorties)
        const setData = isEntries ? setEntriesData : setSortiesData;
        setData(prevData => {
            const updatedData = { ...prevData };
            updatedData[productId] = (updatedData[productId] || 0) + 1;
            return updatedData;
        });

        message.success(`Produit ${productId} ajouté aux ${isEntries ? 'entrées' : 'sorties'}.`);

        // Nullify the barcode on the server only if it came from the scanner
        // or if manually entered value matches the last scanned barcode
         if (productId === receivedBarcode) {
            nullifyQRCode(productId);
        } else {
             // If added manually, clear the receivedBarcode state
             // so it doesn't get accidentally nullified later.
             setReceivedBarcode(null);
         }


        // Clear input field
        setInputValue('');
    };

    const handleAddNumber = () => {
        // Manually trigger addNumber with the current input value
        addNumber(inputValue);
        // Clear any pending timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };

    const toggleState = () => {
        setIsEntries(!isEntries);
        // Clear input when switching modes to avoid confusion
        setInputValue('');
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };

    const validateAndExport = async () => {
        const dataToExport = isEntries ? entriesData : sortiesData;
        if (Object.keys(dataToExport).length === 0) {
            message.warn(`Aucune ${isEntries ? 'entrée' : 'sortie'} à exporter.`);
            return;
        }
    
        const documentTitle = isEntries ? 'BON D\'ENTRÉE' : 'BON DE SORTIE';
        const themeColor = isEntries ? { argb: 'FF1890FF' } : { argb: 'FFF40009' };
        const lightThemeColor = isEntries ? { argb: 'FFE6F7FF' } : { argb: 'FFFFECE6' };
    
        // --- Excel Generation ---
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(isEntries ? 'Entrées' : 'Sorties');
        worksheet.columns = [
            { header: 'Produit ID', key: 'id', width: 25 },
            { header: 'Nom Produit', key: 'name', width: 30 },
            { header: 'Quantité', key: 'quantity', width: 15 }
        ];
        worksheet.addRow([]);
        const titleRow = worksheet.addRow([documentTitle]);
        titleRow.height = 24;
        worksheet.mergeCells(`A2:${worksheet.lastColumn.letter}2`);
        const titleCell = worksheet.getCell('A2');
        titleCell.font = { bold: true, size: 16, name: 'Calibri' };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: lightThemeColor };
        const dateRow = worksheet.addRow([`Date: ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric'})}`]);
        worksheet.mergeCells(`A3:${worksheet.lastColumn.letter}3`);
        const dateCell = worksheet.getCell('A3');
        dateCell.font = { italic: true, size: 11, name: 'Calibri' };
        dateCell.alignment = { horizontal: 'center' };
        dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
        worksheet.addRow([]);
        const headerRow = worksheet.addRow(['Produit ID', 'Nom Produit', 'Quantité']);
        headerRow.height = 20;
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: themeColor };
            cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        });
        let rowIndex = 0;
        Object.entries(dataToExport).forEach(([productId, quantity]) => {
            const productName = inventoryProductDetails[productId] || `Produit ${productId}`;
            const dataRow = worksheet.addRow([productId, productName, quantity]);
            const isEven = rowIndex % 2 === 0;
            const rowColor = isEven ? { argb: 'FFF9F9F9' } : { argb: 'FFFFFFFF' };
            dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.alignment = { vertical: 'middle', horizontal: colNumber === 3 ? 'center' : 'left', indent: colNumber !== 3 ? 1 : 0 };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: rowColor };
                cell.border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } } };
                cell.font = { name: 'Calibri', size: 11 };
            });
            rowIndex++;
        });
        worksheet.addRow([]);
        const totalQuantity = Object.values(dataToExport).reduce((sum, count) => sum + count, 0);
        const totalRow = worksheet.addRow(['Total', null, totalQuantity]);
        worksheet.mergeCells(`A${totalRow.getCell(1).row}:B${totalRow.getCell(1).row}`);
        const totalLabelCell = totalRow.getCell(1);
        totalLabelCell.font = { bold: true, size: 12, name: 'Calibri' };
        totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
        totalLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
        totalLabelCell.border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'thin' } };
        const totalValueCell = totalRow.getCell(3);
        totalValueCell.font = { bold: true, size: 12, name: 'Calibri', color: { argb: 'FF000000' } };
        totalValueCell.alignment = { horizontal: 'center', vertical: 'middle' };
        totalValueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
        totalValueCell.border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'medium' } };
        worksheet.getCell(`B${totalRow.getCell(1).row}`).border = {
            top: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'thin' }
        };
        const bonFileName = `${isEntries ? 'bon_d_entree' : 'bon_de_sortie'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        try {
            const bonBuffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([bonBuffer]), bonFileName);
            message.success(`Le ${documentTitle} a été exporté avec succès !`);
        } catch (exportError) {
            console.error("Error exporting Excel file:", exportError);
            message.error("Erreur lors de la génération du fichier Excel.");
            return;
        }
    
        const updatesToSend = Object.entries(dataToExport).map(([productId, quantity]) => ({
            type: isEntries ? 'Entree' : 'Sortie',
            product: productId,
            quantity: quantity,
        }));
    
        console.log('Client-side: Sending updates (bulk):', updatesToSend);
    
        try {
            const [inventoryResponse, logResponse] = await Promise.all([
                fetch('http://51.83.99.192:5000/api/update-inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatesToSend),
                }).then(response => {
                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(`[Inventaire] Échec de la mise à jour en lot: ${err.errors ? JSON.stringify(err.errors) : err.error || response.statusText}`);
                        }).catch(() => {
                            throw new Error(`[Inventaire] Échec de la mise à jour en lot: ${response.statusText} (Status: ${response.status})`);
                        });
                    }
                    return response.json();
                }),
                fetch('http://51.83.99.192:5000/api/update-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatesToSend),
                }).then(response => {
                    if (!response.ok) {
                        return response.json().then(err => {
                            // Log the error received from the backend
                            console.error("[Journal] Backend error:", err);
                            throw new Error(`[Journal] Échec de la mise à jour en lot: ${err.error || response.statusText}`);
                        }).catch(() => {
                            throw new Error(`[Journal] Échec de la mise à jour en lot: ${response.statusText} (Status: ${response.status})`);
                        });
                    }
                    return response.json();
                }),
            ]);
    
            console.log("Bulk inventory update response:", inventoryResponse);
            console.log("Bulk transaction log response:", logResponse);
    
            message.success('Inventaire et journal des transactions mis à jour avec succès sur le serveur.');
    
            if (isEntries) {
                setEntriesData({});
            } else {
                setSortiesData({});
            }
    
        } catch (updateError) {
            console.error('Erreur lors de la mise à jour côté serveur :', updateError);
            message.error(`Erreur de mise à jour serveur: ${updateError.message}. Les données locales n'ont pas été effacées.`);
        }
    };
    

    // Prepare data for the Ant Design Table
    const currentData = isEntries ? entriesData : sortiesData;
    const tableData = Object.entries(currentData).map(([productId, count], index) => ({
        key: index, // Unique key for React rendering
        productId: productId, // The product ID (string)
        productName: inventoryProductDetails[productId] || `Produit ${productId}`, // Get name
        count: count // The quantity counted
    }));

    // Define columns for the Ant Design Table
    const columns = [
        {
            title: 'Produit ID',
            dataIndex: 'productId',
            key: 'productId',
            // Sorter for string Product IDs
            sorter: (a, b) => a.productId.localeCompare(b.productId),
            ellipsis: true, // Add ellipsis if ID is too long
        },
         {
            title: 'Nom Produit', // Added Name column to table
            dataIndex: 'productName',
            key: 'productName',
            sorter: (a, b) => a.productName.localeCompare(b.productName),
             ellipsis: true,
        },
        {
            title: isEntries ? 'Quantité Entrée' : 'Quantité Sortie',
            dataIndex: 'count',
            key: 'count',
            sorter: (a, b) => a.count - b.count, // Sorter for numeric count
            align: 'center', // Center align the count
        }
    ];

    return (
        <div className="page-container" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: '10px' }}>
                 {/* Title removed as per original code, assuming it's handled elsewhere */}
                {/* <Title level={2} className="page-title">{isEntries ? 'Gestion des Entrées' : 'Gestion des Sorties'}</Title> */}

                <div className="toggle-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f0f2f5', padding: '5px 10px', borderRadius: '15px' }}>
                    <span style={{ color: !isEntries ? '#F40009' : 'rgba(0, 0, 0, 0.65)', fontWeight: !isEntries ? 'bold': 'normal' }}>Sorties</span>
                    <Switch
                        checked={isEntries}
                        onChange={toggleState}
                        checkedChildren={<ImportOutlined />} // Icon for Entries
                        unCheckedChildren={<ExportOutlined />} // Icon for Sorties
                        style={{ backgroundColor: isEntries ? '#1890ff' : '#F40009' }}
                    />
                    <span style={{ color: isEntries ? '#1890ff' : 'rgba(0, 0, 0, 0.65)', fontWeight: isEntries ? 'bold': 'normal' }}>Entrées</span>
                </div>
            </div>

            <Card className="input-card" style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <Input
                        placeholder={isEntries ? "Scanner ou entrer l'ID du produit entrant" : "Scanner ou entrer l'ID du produit sortant"}
                        value={inputValue}
                        onChange={handleInputChange}
                        onPressEnter={handleAddNumber} // Allow adding with Enter key
                        type="text" // Changed to text to allow any string
                        style={{ flex: '1', minWidth: '250px' }} // Allow input to grow
                        autoFocus // Focus the input on load/render
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddNumber}
                        // Style matches the current mode (Entrée/Sortie)
                        style={{ backgroundColor: isEntries ? '#1890ff' : '#F40009', borderColor: isEntries ? '#1890ff' : '#F40009' }}
                    >
                        Ajouter {isEntries ? 'Entrée' : 'Sortie'}
                    </Button>
                </div>
            </Card>

            <Card className="table-card" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: '10px' }}>
                    <Title level={4} style={{ margin: 0 }}>
                        {isEntries ? 'Produits Entrants Scannés' : 'Produits Sortants Scannés'}
                    </Title>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                         <Typography.Text strong>
                            Total : {Object.values(currentData).reduce((sum, count) => sum + count, 0)}
                         </Typography.Text>

                        <Button
                            type="primary"
                            icon={<FileExcelOutlined />}
                            onClick={validateAndExport}
                            disabled={Object.keys(currentData).length === 0} // Disable if no data
                            style={{
                                backgroundColor: '#52c41a', // Green color for validate/export
                                borderColor: '#52c41a'
                            }}
                        >
                            Valider et Exporter
                        </Button>
                    </div>
                </div>
                <Table
                    columns={columns}
                    dataSource={tableData}
                    pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }} // Added pagination
                    size="small" // Make table more compact
                    rowKey="productId" // Use productId as the unique row key for AntD Table
                    locale={{ emptyText: `Aucune ${isEntries ? 'entrée' : 'sortie'} ajoutée pour l'instant` }}
                    scroll={{ x: 'max-content' }} // Ensure table is scrollable horizontally if needed
                />
            </Card>
        </div>
    );
}

export default SecondPage;