import React, { useState, useCallback, useEffect } from 'react';
import { AlertCircle, Package, MapPin, Truck, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

const ParcelPerfectApp = () => {
  // Built-in token ID - replace this with your actual token
  const BUILT_IN_TOKEN = '30a40d09ce1b68b6f3567588a7d5e39842431844'; // Replace with actual token
  
  // State management
  const [token, setToken] = useState(BUILT_IN_TOKEN);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('places'); // Start with places since auth is automatic
  const [responses, setResponses] = useState({});
  const [quoteData, setQuoteData] = useState({
    origPlace: '',
    destPlace: '',
    origPlaceId: null,
    destPlaceId: null,
    quoteNo: '',
    selectedService: ''
  });

  // Base URL for API
  const BASE_URL = 'https://adpdemo.pperfect.com/ecomService/v28/Json/';

  // Test token validity by making a simple API call
  const testToken = async (testTokenId) => {
    try {
      const formData = new FormData();
      formData.append('method', 'getDefItems');
      formData.append('class', 'quote');
      formData.append('params', JSON.stringify({}));
      formData.append('token_id', testTokenId);

      const response = await fetch(BASE_URL, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      // Check if the response indicates a valid token
      return !data.error && response.ok;
    } catch (error) {
      console.error('Token test failed:', error);
      return false;
    }
  };

  // Auto-validate token on component mount
  useEffect(() => {
    const validateBuiltInToken = async () => {
      if (BUILT_IN_TOKEN && BUILT_IN_TOKEN !== 'your-token-id-here') {
        setLoading(true);
        try {
          const isValid = await testToken(BUILT_IN_TOKEN);
          if (isValid) {
            setResponses(prev => ({
              ...prev,
              auth: { success: true, token: BUILT_IN_TOKEN, method: 'built-in' }
            }));
          } else {
            setResponses(prev => ({
              ...prev,
              auth: { success: false, error: 'Built-in token is invalid or expired', method: 'built-in' }
            }));
            setToken(null);
            setActiveTab('auth');
          }
        } catch (error) {
          setResponses(prev => ({
            ...prev,
            auth: { success: false, error: error.message, method: 'built-in' }
          }));
          setToken(null);
          setActiveTab('auth');
        } finally {
          setLoading(false);
        }
      } else {
        // No valid built-in token, show auth tab
        setToken(null);
        setActiveTab('auth');
      }
    };

    validateBuiltInToken();
  }, []);

  // Generic API call function
  const makeApiCall = useCallback(async (method, className, params, useToken = true) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('method', method);
      formData.append('class', className);
      formData.append('params', JSON.stringify(params));
      
      if (useToken && token) {
        formData.append('token_id', token);
      }

      const response = await fetch(BASE_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Place lookup functions
  const getPlacesByName = async (name) => {
    if (!name.trim()) {
      alert('Please enter a place name');
      return;
    }

    try {
      const response = await makeApiCall('getPlacesByName', 'quote', { name });
      setResponses(prev => ({ ...prev, placesByName: response }));
    } catch (error) {
      alert(`Failed to get places: ${error.message}`);
    }
  };

  const getPlacesByPostcode = async (postcode) => {
    if (!postcode.trim()) {
      alert('Please enter a postcode');
      return;
    }

    try {
      const response = await makeApiCall('getPlacesByPostcode', 'quote', { postcode });
      setResponses(prev => ({ ...prev, placesByPostcode: response }));
    } catch (error) {
      alert(`Failed to get places: ${error.message}`);
    }
  };

  // Quote functions
  const requestQuote = async () => {
    if (!quoteData.origPlaceId || !quoteData.destPlaceId) {
      alert('Please select both origin and destination places');
      return;
    }

    const quoteDetails = {
      origpers: "Test Sender",
      origperadd1: "123 Test Street",
      origperadd2: "Test Suburb",
      origperadd3: "Test City",
      origperadd4: "",
      origperpcode: "1234",
      origpercontact: "John Sender",
      origperphone: "0123456789",
      origplace: parseInt(quoteData.origPlaceId),
      notifyorigpers: 1,
      origpercell: "0821234567",
      origperemail: "sender@test.com",
      destpers: "Test Recipient",
      destperadd1: "456 Destination Ave",
      destperadd2: "Dest Suburb",
      destperadd3: "Dest City",
      destperadd4: "",
      destperpcode: "5678",
      destplace: parseInt(quoteData.destPlaceId),
      destpercontact: "Jane Recipient",
      destperphone: "0987654321",
      notifydestpers: 1,
      destpercell: "0829876543",
      destperemail: "recipient@test.com"
    };

    const contents = [
      {
        item: 1,
        pieces: 1,
        dim1: 30,
        dim2: 20,
        dim3: 10,
        actmass: 2.5
      }
    ];

    try {
      const response = await makeApiCall('requestQuote', 'quote', {
        details: quoteDetails,
        contents: contents
      });
      
      setResponses(prev => ({ ...prev, requestQuote: response }));
      
      if (response.quoteno) {
        setQuoteData(prev => ({ ...prev, quoteNo: response.quoteno }));
        setActiveTab('operations');
      }
    } catch (error) {
      alert(`Failed to request quote: ${error.message}`);
    }
  };

  const updateService = async () => {
    if (!quoteData.quoteNo || !quoteData.selectedService) {
      alert('Please enter quote number and select a service');
      return;
    }

    try {
      const response = await makeApiCall('updateService', 'quote', {
        quoteno: quoteData.quoteNo,
        service: quoteData.selectedService,
        reference: "Test Shipment"
      });
      
      setResponses(prev => ({ ...prev, updateService: response }));
    } catch (error) {
      alert(`Failed to update service: ${error.message}`);
    }
  };

  const quoteToCollection = async () => {
    if (!quoteData.quoteNo) {
      alert('Please enter a quote number');
      return;
    }

    try {
      const response = await makeApiCall('quoteToCollection', 'collection', {
        quoteno: quoteData.quoteNo,
        starttime: "08:00",
        endtime: "17:00",
        printLabels: 1,
        printWaybill: 1
      });
      
      setResponses(prev => ({ ...prev, quoteToCollection: response }));
    } catch (error) {
      alert(`Failed to create collection: ${error.message}`);
    }
  };

  // Response display component
  const ResponseDisplay = ({ title, data }) => {
    if (!data) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
        <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
        <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Package className="text-blue-600 mr-3" size={40} />
              <h1 className="text-4xl font-bold text-gray-800">Parcel Perfect</h1>
            </div>
            <p className="text-gray-600">eCommerce API Client</p>
            {token ? (
              <div className="mt-4 flex items-center justify-center">
                <CheckCircle className="text-green-500 mr-2" size={20} />
                <span className="text-green-700 font-medium">Authenticated with Built-in Token</span>
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-center">
                <XCircle className="text-red-500 mr-2" size={20} />
                <span className="text-red-700 font-medium">Built-in Token Invalid - Manual Auth Required</span>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap justify-center mb-8 bg-white rounded-lg shadow-sm p-2">
            {[
              { id: 'auth', label: 'Authentication', icon: AlertCircle },
              { id: 'places', label: 'Places', icon: MapPin },
              { id: 'quote', label: 'Quote', icon: FileText },
              { id: 'operations', label: 'Operations', icon: Truck }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center px-4 py-2 m-1 rounded-lg transition-colors ${
                  activeTab === id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                } ${id !== 'auth' && !token ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={id !== 'auth' && !token}
              >
                <Icon size={18} className="mr-2" />
                {label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Authentication Tab */}
            {activeTab === 'auth' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Authentication Status</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <h3 className="font-semibold text-blue-800 mb-2">Built-in Token Configuration</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        This app is configured with a built-in token ID. To use your own token:
                      </p>
                      <ol className="text-sm text-blue-700 space-y-1">
                        <li>1. Replace the BUILT_IN_TOKEN constant in the code</li>
                        <li>2. Set it to your actual token ID</li>
                        <li>3. The app will automatically authenticate on load</li>
                      </ol>
                    </div>
                    
                    {token ? (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center mb-2">
                          <CheckCircle className="text-green-500 mr-2" size={16} />
                          <span className="text-green-700 font-medium text-sm">Built-in Token Active</span>
                        </div>
                        <p className="text-xs text-green-600 font-mono break-all">
                          {token.substring(0, 20)}...
                        </p>
                      </div>
                    ) : (
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-center mb-2">
                          <XCircle className="text-red-500 mr-2" size={16} />
                          <span className="text-red-700 font-medium text-sm">Token Authentication Failed</span>
                        </div>
                        <p className="text-xs text-red-600">
                          The built-in token is either invalid, expired, or not configured properly.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-yellow-800 mb-2">Token Configuration</h3>
                      <p className="text-sm text-yellow-700 mb-3">
                        Current built-in token status:
                      </p>
                      <div className="text-sm text-yellow-700">
                        {BUILT_IN_TOKEN === 'your-token-id-here' ? (
                          <p className="text-red-600 font-medium">
                            ⚠️ Token not configured - please replace BUILT_IN_TOKEN with your actual token
                          </p>
                        ) : (
                          <p className="text-green-600 font-medium">
                            ✅ Token configured and ready for validation
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">How to get Token ID</h3>
                      <ol className="text-sm text-gray-600 space-y-1">
                        <li>1. Contact Parcel Perfect support</li>
                        <li>2. Email: <strong>support@parcelperfect.com</strong></li>
                        <li>3. Subject: "Request for ecom test account"</li>
                        <li>4. Replace BUILT_IN_TOKEN in the code</li>
                      </ol>
                    </div>
                  </div>
                </div>
                <ResponseDisplay title="Authentication Response" data={responses.auth} />
              </div>
            )}

            {/* Places Tab */}
            {activeTab === 'places' && token && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Place Lookup</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Search by Name</h3>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="Enter place name (e.g., Johan)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            getPlacesByName(e.target.value);
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.target.parentElement.querySelector('input');
                          getPlacesByName(input.value);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Search
                      </button>
                    </div>
                    <ResponseDisplay title="Places by Name" data={responses.placesByName} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Search by Postcode</h3>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="Enter postcode (e.g., 7700)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            getPlacesByPostcode(e.target.value);
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.target.parentElement.querySelector('input');
                          getPlacesByPostcode(input.value);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Search
                      </button>
                    </div>
                    <ResponseDisplay title="Places by Postcode" data={responses.placesByPostcode} />
                  </div>
                </div>
              </div>
            )}

            {/* Quote Tab */}
            {activeTab === 'quote' && token && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Request Quote</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Origin Place ID
                        </label>
                        <input
                          type="number"
                          value={quoteData.origPlaceId || ''}
                          onChange={(e) => setQuoteData(prev => ({ ...prev, origPlaceId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 2159"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Destination Place ID
                        </label>
                        <input
                          type="number"
                          value={quoteData.destPlaceId || ''}
                          onChange={(e) => setQuoteData(prev => ({ ...prev, destPlaceId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 4001"
                        />
                      </div>
                      <button
                        onClick={requestQuote}
                        disabled={loading}
                        className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50"
                      >
                        {loading ? 'Requesting Quote...' : 'Request Quote'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">Sample Package Details</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Dimensions: 30cm × 20cm × 10cm</li>
                        <li>• Weight: 2.5kg</li>
                        <li>• Pieces: 1</li>
                        <li>• From: Test Sender (Johannesburg)</li>
                        <li>• To: Test Recipient (Cape Town)</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <ResponseDisplay title="Quote Response" data={responses.requestQuote} />
              </div>
            )}

            {/* Operations Tab */}
            {activeTab === 'operations' && token && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Quote Operations</h2>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Update Service</h3>
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={quoteData.quoteNo}
                          onChange={(e) => setQuoteData(prev => ({ ...prev, quoteNo: e.target.value }))}
                          placeholder="Quote Number (e.g., QTE02382646)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={quoteData.selectedService}
                          onChange={(e) => setQuoteData(prev => ({ ...prev, selectedService: e.target.value }))}
                          placeholder="Service Code (e.g., ECO)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={updateService}
                          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                        >
                          Update Service
                        </button>
                      </div>
                      <ResponseDisplay title="Update Service Response" data={responses.updateService} />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Create Collection</h3>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">Collection Window:</p>
                          <p className="text-sm">• Start: 08:00</p>
                          <p className="text-sm">• End: 17:00</p>
                          <p className="text-sm">• Print Labels: Yes</p>
                          <p className="text-sm">• Print Waybill: Yes</p>
                        </div>
                        <button
                          onClick={quoteToCollection}
                          className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
                        >
                          Create Collection
                        </button>
                      </div>
                      <ResponseDisplay title="Collection Response" data={responses.quoteToCollection} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Message for when token is not available */}
            {!token && activeTab !== 'auth' && (
              <div className="text-center py-12">
                <XCircle className="mx-auto text-red-500 mb-4" size={48} />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h3>
                <p className="text-gray-600 mb-4">
                  The built-in token is not configured or invalid. Please check the Authentication tab for setup instructions.
                </p>
                <button
                  onClick={() => setActiveTab('auth')}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Go to Authentication
                </button>
              </div>
            )}

            {/* Loading Overlay */}
            {loading && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
                  <Clock className="animate-spin mr-3 text-blue-500" size={24} />
                  <span className="text-gray-700">Processing request...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParcelPerfectApp;