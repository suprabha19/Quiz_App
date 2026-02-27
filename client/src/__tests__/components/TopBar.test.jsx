import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TopBar from '../../components/TopBar';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock authAPI
vi.mock('../../services/api', () => ({
  authAPI: {
    getProfile: vi.fn().mockResolvedValue({ data: { username: 'test', role: 'user' } })
  }
}));

const MockedTopBar = ({ categories = [], onCategorySelect = vi.fn() }) => (
  <BrowserRouter>
    <AuthProvider>
      <TopBar categories={categories} onCategorySelect={onCategorySelect} />
    </AuthProvider>
  </BrowserRouter>
);

describe('TopBar Component', () => {
  const mockCategories = ['HTML', 'CSS', 'JavaScript', 'React', 'Python'];

  it('should render search bar', () => {
    render(<MockedTopBar categories={mockCategories} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should filter categories based on search query', () => {
    render(<MockedTopBar categories={mockCategories} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'java' } });

    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('should show no results when search matches nothing', () => {
    render(<MockedTopBar categories={mockCategories} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'xyz123' } });

    expect(screen.getByText(/no categories found/i)).toBeInTheDocument();
  });

  it('should call onCategorySelect when category is clicked', () => {
    const mockOnSelect = vi.fn();
    render(<MockedTopBar categories={mockCategories} onCategorySelect={mockOnSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'CSS' } });

    const cssButton = screen.getByText('CSS');
    fireEvent.click(cssButton);

    expect(mockOnSelect).toHaveBeenCalledWith('CSS');
  });

  it('should clear search when category is selected', () => {
    const mockOnSelect = vi.fn();
    render(<MockedTopBar categories={mockCategories} onCategorySelect={mockOnSelect} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'HTML' } });

    const htmlButton = screen.getByText('HTML');
    fireEvent.click(htmlButton);

    expect(searchInput.value).toBe('');
  });

  it('should perform case-insensitive search', () => {
    render(<MockedTopBar categories={mockCategories} />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    // Search with lowercase
    fireEvent.change(searchInput, { target: { value: 'javascript' } });
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });
});
