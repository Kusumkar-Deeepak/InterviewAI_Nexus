import { useState, useEffect } from 'react';
import axios from 'axios';
import InterviewTable from './InterviewTable';
import Pagination from './Pagination';
import Filters from './Filters';
import Loading from '../../components/Loading';
import { useAuth0 } from '@auth0/auth0-react';

const ViewInterviews = () => {
  const { user } = useAuth0();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 8
  });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    jobTitle: '',
    applicantName: '',
    companyName: ''
  });

  // Sort
  const [sort, setSort] = useState({
    field: 'createdAt',
    order: 'desc'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First validate interviews
      await axios.get('/api/interviews/validate', {
        params: { email: user.email }
      });

      // Then fetch interviews
      const response = await axios.get('/api/interviews', {
        params: {
          email: user.email,
          ...filters,
          sortBy: sort.field,
          sortOrder: sort.order
        }
      });

      // Make sure we handle the response structure correctly
      const data = response.data?.data || [];
      setInterviews(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load interviews');
      console.error('Fetch error:', err);
      setInterviews([]); // Reset interviews on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchData();
    }
  }, [user, filters, sort]);

  // Pagination calculations
  const indexOfLast = pagination.currentPage * pagination.perPage;
  const indexOfFirst = indexOfLast - pagination.perPage;
  const currentInterviews = interviews.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(interviews.length / pagination.perPage);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto text-center">
        <div className="text-red-500 font-medium mb-4">{error}</div>
        <button 
          onClick={fetchData}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto text-center">
        <h3 className="text-gray-500 text-lg mb-4">No interviews found</h3>
        <button 
          onClick={fetchData}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Refresh List
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800">Interview Dashboard</h2>
        <p className="text-gray-500 mt-1">Manage your scheduled interviews</p>
      </div>
      
      <Filters 
        filters={filters}
        onFilterChange={setFilters}
        sort={sort}
        onSortChange={setSort}
      />
      
      <div className="overflow-x-auto">
        <InterviewTable interviews={currentInterviews} />
      </div>
      
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
        />
      </div>
    </div>
  );
};

export default ViewInterviews; 