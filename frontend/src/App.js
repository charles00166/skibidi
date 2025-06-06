import React, { useState, useRef } from 'react';
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

  const [invoiceDetails, setInvoiceDetails] = useState({
    number: '6005',
    date: new Date().toISOString().split('T')[0],
    deliveryOrderNo: '',
    lpoNumber: 'VERBAL'
  });

  const [items, setItems] = useState([
    { id: 1, description: '', qty: '', unit: 'Set', rate: '', amount: 0 }
  ]);

  const [vatRate, setVatRate] = useState(5);
  const printRef = useRef();

  const addItem = () => {
    const newItem = {
      id: items.length + 1,
      description: '',
      qty: '',
      unit: 'Set',
      rate: '',
      amount: 0
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
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateVat = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * vatRate) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const vat = calculateVat();
    return subtotal + vat;
  };

  const handlePrint = () => {
    window.print();
  };

  const generateNewInvoiceNumber = () => {
    const newNumber = (parseInt(invoiceDetails.number) + 1).toString();
    setInvoiceDetails({ ...invoiceDetails, number: newNumber });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Control Panel */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invoice Generator</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              onClick={handlePrint}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Print Invoice
            </button>
          </div>

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
        <div className="border-b-4 border-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">NA</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-purple-600">{companyInfo.nameArabic}</h1>
                <h2 className="text-xl font-bold text-purple-600">{companyInfo.name} {companyInfo.subtitle}</h2>
                <p className="text-sm text-gray-600">{companyInfo.subtitleArabic}</p>
                <p className="text-sm text-purple-600 font-medium">{companyInfo.description}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
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
                  <th className="p-2 text-left w-24">Amount</th>
                  <th className="p-2 text-left w-12 print:hidden">Action</th>
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
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="w-full border-none outline-none print:bg-transparent"
                      >
                        <option value="Set">Set</option>
                        <option value="Pcs">Pcs</option>
                        <option value="Box">Box</option>
                        <option value="Mtr">Mtr</option>
                        <option value="Kg">Kg</option>
                      </select>
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
                    <td className="p-2 print:hidden">
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                
                {/* Empty rows for spacing */}
                {Array.from({ length: Math.max(0, 10 - items.length) }).map((_, index) => (
                  <tr key={`empty-${index}`} className="border-b h-8">
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
                      <td className="p-2 text-right font-medium">Vat {vatRate}%:</td>
                      <td className="p-2 text-right">{calculateVat().toFixed(2)}</td>
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