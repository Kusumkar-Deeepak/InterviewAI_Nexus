import { useState } from 'react';
import { FiFilter, FiSearch, FiArrowUp, FiArrowDown } from 'react-icons/fi';

const Filters = ({ filters, onFilterChange, onSortChange, sort }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const applyFilters = () => {
    onFilterChange(localFilters);
  };
  
  const handleSort = (field) => {
    const order = sort.field === field && sort.order === 'asc' ? 'desc' : 'asc';
    onSortChange({ field, order });
  };

  const getSortIcon = (field) => {
    if (sort.field !== field) return null;
    return sort.order === 'asc' ? <FiArrowUp className="ml-1" /> : <FiArrowDown className="ml-1" />;
  };

  return (
    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Applicant Name */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Name</label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              name="applicantName"
              value={localFilters.applicantName}
              onChange={handleInputChange}
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
              placeholder="Search..."
            />
          </div>
        </div>
        
        {/* Job Title */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
          <input
            type="text"
            name="jobTitle"
            value={localFilters.jobTitle}
            onChange={handleInputChange}
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3"
            placeholder="Filter by title..."
          />
        </div>
        
        {/* Status */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={localFilters.status}
            onChange={handleInputChange}
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3"
          >
            <option value="">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        
        {/* Sort & Filter Buttons */}
        <div className="md:col-span-3 flex items-end space-x-2">
          <button
            onClick={() => handleSort('interviewDate')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sort by Date {getSortIcon('interviewDate')}
          </button>
          <button
            onClick={applyFilters}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiFilter className="mr-2 h-4 w-4" />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default Filters;