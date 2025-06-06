import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';

const InvoiceGenerator = () => {
  const [companyInfo, setCompanyInfo] = useState({
    name: 'NOOR-AL-ANWAR',
    nameArabic: 'نــــــــور الانـــــــوار',
    subtitle: 'SANITARY & ELECTRICAL TRADING',
    subtitleArabic: 'لتجارة الادوات الصحية والكهربائية',
    description: 'DEALER\'S IN SANITARY & ELECTRICAL MATERIAL AND ORDER SUPPLIERS',
    vatTrn: '100318837000003'
  });

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    address: '',
    telFax: '',
    trn: ''
  });

  const [savedCustomers, setSavedCustomers] = useState([]);
  const [customerPurchases, setCustomerPurchases] = useState({});
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [showReporting, setShowReporting] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  const [invoiceDetails, setInvoiceDetails] = useState({
    number: '6005',
    date: new Date().toISOString().split('T')[0],
    deliveryOrderNo: '',
    lpoNumber: 'VERBAL'
  });

  const [items, setItems] = useState([
    { id: 1, description: '', qty: '', unit: '', rate: '', amount: 0, vatAmount: 0 }
  ]);

  const [vatRate, setVatRate] = useState(5);
  const printRef = useRef();

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedCustomersData = localStorage.getItem('invoiceCustomers');
    const savedPurchasesData = localStorage.getItem('customerPurchases');
    const savedInvoiceNumber = localStorage.getItem('lastInvoiceNumber');
    
    if (savedCustomersData) {
      setSavedCustomers(JSON.parse(savedCustomersData));
    }
    if (savedPurchasesData) {
      setCustomerPurchases(JSON.parse(savedPurchasesData));
    }
    if (savedInvoiceNumber) {
      setInvoiceDetails(prev => ({ ...prev, number: savedInvoiceNumber }));
    }
  }, []);

  // Save data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('invoiceCustomers', JSON.stringify(savedCustomers));
  }, [savedCustomers]);

  useEffect(() => {
    localStorage.setItem('customerPurchases', JSON.stringify(customerPurchases));
  }, [customerPurchases]);

  useEffect(() => {
    localStorage.setItem('lastInvoiceNumber', invoiceDetails.number);
  }, [invoiceDetails.number]);

  const saveCustomer = () => {
    if (customerInfo.name.trim()) {
      const existingIndex = savedCustomers.findIndex(customer => 
        customer.name.toLowerCase() === customerInfo.name.toLowerCase()
      );
      
      if (existingIndex >= 0) {
        // Update existing customer
        const updatedCustomers = [...savedCustomers];
        updatedCustomers[existingIndex] = { ...customerInfo, id: savedCustomers[existingIndex].id };
        setSavedCustomers(updatedCustomers);
      } else {
        // Add new customer
        const newCustomer = { ...customerInfo, id: Date.now() };
        setSavedCustomers([...savedCustomers, newCustomer]);
      }
      alert('Customer saved successfully!');
    }
  };

  const recordPurchase = () => {
    if (customerInfo.name.trim()) {
      const total = calculateTotal();
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const customerKey = customerInfo.name.toLowerCase();
      
      setCustomerPurchases(prev => {
        const updated = { ...prev };
        if (!updated[customerKey]) {
          updated[customerKey] = {};
        }
        if (!updated[customerKey][currentMonth]) {
          updated[customerKey][currentMonth] = 0;
        }
        updated[customerKey][currentMonth] += total;
        return updated;
      });
    }
  };

  const getCustomerMonthlyTotal = (customerName, month) => {
    const customerKey = customerName.toLowerCase();
    return customerPurchases[customerKey]?.[month] || 0;
  };

  const getCustomerTotalPurchases = (customerName) => {
    const customerKey = customerName.toLowerCase();
    const customerData = customerPurchases[customerKey];
    if (!customerData) return 0;
    
    return Object.values(customerData).reduce((sum, amount) => sum + amount, 0);
  };

  const getMonthDateRange = (monthString) => {
    const [year, month] = monthString.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[parseInt(month) - 1];
    const daysInMonth = new Date(year, month, 0).getDate();
    return `${monthName} ${year} (1st - ${daysInMonth}th)`;
  };

  const getCurrentMonthRange = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return getMonthDateRange(currentMonth);
  };

  const getAllMonthsData = () => {
    const allData = [];
    Object.keys(customerPurchases).forEach(customerKey => {
      const customerName = savedCustomers.find(c => 
        c.name.toLowerCase() === customerKey
      )?.name || customerKey;
      
      Object.keys(customerPurchases[customerKey]).forEach(month => {
        allData.push({
          customer: customerName,
          month: getMonthDateRange(month),
          monthKey: month,
          amount: customerPurchases[customerKey][month]
        });
      });
    });
    
    return allData.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  };

  const getTopCustomers = () => {
    return savedCustomers
      .map(customer => ({
        ...customer,
        totalSpent: getCustomerTotalPurchases(customer.name)
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .filter(customer => customer.totalSpent > 0);
  };

  const loadCustomer = (customer) => {
    setCustomerInfo(customer);
    setShowCustomerSelector(false);
    setCustomerSearchTerm('');
  };

  const deleteCustomer = (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      const customerToDelete = savedCustomers.find(c => c.id === customerId);
      if (customerToDelete) {
        // Remove from purchases as well
        const customerKey = customerToDelete.name.toLowerCase();
        setCustomerPurchases(prev => {
          const updated = { ...prev };
          delete updated[customerKey];
          return updated;
        });
      }
      setSavedCustomers(savedCustomers.filter(customer => customer.id !== customerId));
    }
  };

  const clearCustomerInfo = () => {
    setCustomerInfo({ name: '', address: '', telFax: '', trn: '' });
  };

  const filteredCustomers = savedCustomers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.address.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const addItem = () => {
    const newItem = {
      id: items.length + 1,
      description: '',
      qty: '',
      unit: '',
      rate: '',
      amount: 0,
      vatAmount: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'qty' || field === 'rate') {
          const qty = parseFloat(updatedItem.qty) || 0;
          const rate = parseFloat(updatedItem.rate) || 0;
          updatedItem.amount = qty * rate;
          updatedItem.vatAmount = (updatedItem.amount * vatRate) / 100;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateTotalVat = () => {
    return items.reduce((sum, item) => sum + item.vatAmount, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const vat = calculateTotalVat();
    return subtotal + vat;
  };

  const handlePrint = () => {
    // Record the purchase before printing
    if (customerInfo.name.trim()) {
      const total = calculateTotal();
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const customerKey = customerInfo.name.toLowerCase();
      
      setCustomerPurchases(prev => {
        const updated = { ...prev };
        if (!updated[customerKey]) {
          updated[customerKey] = {};
        }
        if (!updated[customerKey][currentMonth]) {
          updated[customerKey][currentMonth] = 0;
        }
        updated[customerKey][currentMonth] += total;
        return updated;
      });
    }
    
    // Use setTimeout to ensure state updates are processed, then open print dialog
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const exportToPDF = async () => {
    // Record the purchase before PDF export
    if (customerInfo.name.trim()) {
      const total = calculateTotal();
      const currentMonth = new Date().toISOString().slice(0, 7);
      const customerKey = customerInfo.name.toLowerCase();
      
      setCustomerPurchases(prev => {
        const updated = { ...prev };
        if (!updated[customerKey]) {
          updated[customerKey] = {};
        }
        if (!updated[customerKey][currentMonth]) {
          updated[customerKey][currentMonth] = 0;
        }
        updated[customerKey][currentMonth] += total;
        return updated;
      });
    }

    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      const fileName = `Invoice_${invoiceDetails.number}_${customerInfo.name || 'Customer'}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const generateNewInvoiceNumber = () => {
    const currentNumber = parseInt(invoiceDetails.number) || 6005;
    const newNumber = (currentNumber + 1).toString();
    setInvoiceDetails(prev => ({ 
      ...prev, 
      number: newNumber,
      date: new Date().toISOString().split('T')[0]
    }));
    
    // Clear current invoice data
    setItems([{ id: 1, description: '', qty: '', unit: '', rate: '', amount: 0, vatAmount: 0 }]);
    setCustomerInfo({ name: '', address: '', telFax: '', trn: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Control Panel */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invoice Generator</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <button
              onClick={addItem}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Add Item
            </button>
            <button
              onClick={generateNewInvoiceNumber}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              New Invoice
            </button>
            <button
              onClick={() => setShowCustomerSelector(!showCustomerSelector)}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              {showCustomerSelector ? 'Hide Customers' : 'Load Customer'}
            </button>
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Print Invoice
            </button>
          </div>

          {/* Customer Management Section */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Customer Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <button
                onClick={saveCustomer}
                className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
                disabled={!customerInfo.name.trim()}
              >
                Save Customer
              </button>
              <button
                onClick={clearCustomerInfo}
                className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
              >
                Clear Customer
              </button>
              <div className="text-sm text-gray-600 px-3 py-2">
                Saved Customers: {savedCustomers.length}
              </div>
              <div className="text-sm text-gray-600 px-3 py-2">
                {customerInfo.name ? `Current: ${customerInfo.name}` : 'No customer selected'}
              </div>
            </div>
          </div>

          {/* Customer Selector */}
          {showCustomerSelector && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Select Customer</h3>
                <button
                  onClick={() => setShowCustomerSelector(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <input
                type="text"
                placeholder="Search customers..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
              />
              
              <div className="max-h-60 overflow-y-auto">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(customer => {
                    const currentMonth = new Date().toISOString().slice(0, 7);
                    const monthlyTotal = getCustomerMonthlyTotal(customer.name, currentMonth);
                    const totalPurchases = getCustomerTotalPurchases(customer.name);
                    
                    return (
                      <div key={customer.id} className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50">
                        <div className="flex-1 cursor-pointer" onClick={() => loadCustomer(customer)}>
                          <div className="font-medium text-gray-800">{customer.name}</div>
                          <div className="text-sm text-gray-600">{customer.address}</div>
                          <div className="text-xs text-gray-500">{customer.telFax}</div>
                          <div className="text-xs text-blue-600 mt-1">
                            This month: AED {monthlyTotal.toFixed(2)} | Total: AED {totalPurchases.toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomer(customer.id);
                          }}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    {customerSearchTerm ? 'No customers found matching your search.' : 'No saved customers yet.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%)</label>
              <input
                type="number"
                value={vatRate}
                onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDetails.date}
                onChange={(e) => setInvoiceDetails({ ...invoiceDetails, date: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Invoice */}
      <div ref={printRef} className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none">
        {/* Header */}
        <div className="bg-white p-6">
          {/* Company Header Image */}
          <div className="w-full mb-4 flex justify-center">
            <img 
              src="https://media.discordapp.net/attachments/877287421216182403/1370734874771722250/image.png?ex=68438395&is=68423215&hm=24d13e4f33d5ded9b38c7c65292d1cb6177b73148000ec1d71f6f620ce7ef71e&=&format=webp&quality=lossless&width=1715&height=284"
              alt="NOOR-AL-ANWAR Company Header"
              className="max-w-full h-auto max-h-32 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            {/* Fallback header if image fails to load */}
            <div className="w-full h-32 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg flex items-center justify-center relative overflow-hidden" style={{display: 'none'}}>
              <div className="absolute inset-0 flex items-center justify-between px-8">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <div className="w-16 h-16 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">NA</span>
                    </div>
                  </div>
                  <div className="text-white">
                    <h1 className="text-2xl font-bold arabic-text">{companyInfo.nameArabic}</h1>
                    <p className="text-sm opacity-90 arabic-text">{companyInfo.subtitleArabic}</p>
                  </div>
                </div>
                <div className="text-white text-right">
                  <h2 className="text-3xl font-bold tracking-wider">{companyInfo.name}</h2>
                  <h3 className="text-xl font-semibold tracking-wide">{companyInfo.subtitle}</h3>
                  <p className="text-sm mt-1 bg-purple-800 bg-opacity-50 px-3 py-1 rounded">
                    {companyInfo.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center border-b border-gray-300 pb-4">
            <p className="text-sm text-gray-600">VAT TRN NO: {companyInfo.vatTrn}</p>
            <h3 className="text-xl font-bold text-gray-800 mt-2">TAX INVOICE</h3>
          </div>
        </div>

        {/* Customer and Invoice Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Customer Info */}
            <div className="border border-gray-300">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="font-semibold p-2 bg-gray-50 w-1/3">Customer:</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        className="w-full border-none outline-none print:bg-transparent"
                        placeholder="Customer Name"
                      />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="font-semibold p-2 bg-gray-50">Address:</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                        className="w-full border-none outline-none print:bg-transparent"
                        placeholder="Address"
                      />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="font-semibold p-2 bg-gray-50">Tel/Fax No:</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={customerInfo.telFax}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, telFax: e.target.value })}
                        className="w-full border-none outline-none print:bg-transparent"
                        placeholder="Phone/Fax"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold p-2 bg-gray-50">TRN:</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={customerInfo.trn}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, trn: e.target.value })}
                        className="w-full border-none outline-none print:bg-transparent"
                        placeholder="TRN Number"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Invoice Details */}
            <div className="border border-gray-300">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="font-semibold p-2 bg-gray-50 w-1/2">Invoice Number:</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={invoiceDetails.number}
                        onChange={(e) => setInvoiceDetails({ ...invoiceDetails, number: e.target.value })}
                        className="w-full border-none outline-none print:bg-transparent font-semibold"
                      />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="font-semibold p-2 bg-gray-50">Date:</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={invoiceDetails.date}
                        onChange={(e) => setInvoiceDetails({ ...invoiceDetails, date: e.target.value })}
                        className="w-full border-none outline-none print:bg-transparent"
                      />
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="font-semibold p-2 bg-gray-50">Delivery Order No.</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={invoiceDetails.deliveryOrderNo}
                        onChange={(e) => setInvoiceDetails({ ...invoiceDetails, deliveryOrderNo: e.target.value })}
                        className="w-full border-none outline-none print:bg-transparent"
                        placeholder="Delivery Order"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="font-semibold p-2 bg-gray-50">LPO Number:</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={invoiceDetails.lpoNumber}
                        onChange={(e) => setInvoiceDetails({ ...invoiceDetails, lpoNumber: e.target.value })}
                        className="w-full border-none outline-none print:bg-transparent"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-300 mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-2 text-left w-12">Sr No</th>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-left w-16">Qty</th>
                  <th className="p-2 text-left w-16">Unit</th>
                  <th className="p-2 text-left w-20">RATE</th>
                  <th className="p-2 text-left w-20">Amount</th>
                  <th className="p-2 text-left w-20">VAT</th>
                  <th className="p-2 text-left w-12 print:hidden">Remove</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="w-full border-none outline-none print:bg-transparent"
                        placeholder="Item description"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                        className="w-full border-none outline-none print:bg-transparent text-center"
                        placeholder="1"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="w-full border-none outline-none print:bg-transparent text-center"
                        placeholder="Set"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                        className="w-full border-none outline-none print:bg-transparent text-right"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-2 text-right font-medium">
                      {item.amount.toFixed(2)}
                    </td>
                    <td className="p-2 text-right font-medium">
                      {item.vatAmount.toFixed(2)}
                    </td>
                    <td className="p-2 print:hidden">
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-800 text-lg"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                
                {/* Empty rows for spacing */}
                {Array.from({ length: Math.max(0, 8 - items.length) }).map((_, index) => (
                  <tr key={`empty-${index}`} className="border-b h-8">
                    <td className="p-2"></td>
                    <td className="p-2"></td>
                    <td className="p-2"></td>
                    <td className="p-2"></td>
                    <td className="p-2"></td>
                    <td className="p-2"></td>
                    <td className="p-2"></td>
                    <td className="p-2 print:hidden"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-96">
              <div className="border border-gray-300">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 text-right font-medium">Subtotal:</td>
                      <td className="p-2 text-right w-24">{calculateSubtotal().toFixed(2)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-right font-medium">Total VAT:</td>
                      <td className="p-2 text-right">{calculateTotalVat().toFixed(2)}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-2 text-right font-bold">Total:</td>
                      <td className="p-2 text-right font-bold text-lg">{calculateTotal().toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Jact Entry & Mts Entry only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <InvoiceGenerator />
    </div>
  );
}

export default App;