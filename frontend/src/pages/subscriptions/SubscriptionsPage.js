/**
 * Subscription list page component for Subnest frontend
 * 
 * This component displays a list of user subscriptions with filtering,
 * sorting, and pagination capabilities.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const SubscriptionsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    category_id: '',
    search: ''
  });
  const [sorting, setSorting] = useState({
    sort_by: 'next_billing_date',
    sort_order: 'asc'
  });
  const [categories, setCategories] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchSubscriptions();
  }, [page, rowsPerPage, filters, sorting]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
        ...sorting
      };
      
      const response = await api.get('/subscriptions', { params });
      
      setSubscriptions(response.data.data.items);
      setTotalCount(response.data.data.pagination.total);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(0);
  };

  const handleSortChange = (field) => {
    setSorting(prev => ({
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDeleteClick = (subscription) => {
    setSubscriptionToDelete(subscription);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/subscriptions/${subscriptionToDelete.id}`);
      fetchSubscriptions();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'cancelled':
        return 'İptal Edildi';
      case 'paused':
        return 'Duraklatıldı';
      default:
        return status;
    }
  };

  const getBillingCycleLabel = (cycle) => {
    switch (cycle) {
      case 'weekly':
        return 'Haftalık';
      case 'monthly':
        return 'Aylık';
      case 'quarterly':
        return '3 Aylık';
      case 'yearly':
        return 'Yıllık';
      default:
        return cycle;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Abonelikler
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/subscriptions/add')}
        >
          Abonelik Ekle
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            label="Ara"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            select
            label="Durum"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            variant="outlined"
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value="active">Aktif</MenuItem>
            <MenuItem value="cancelled">İptal Edildi</MenuItem>
            <MenuItem value="paused">Duraklatıldı</MenuItem>
          </TextField>
          
          <TextField
            select
            label="Kategori"
            name="category_id"
            value={filters.category_id}
            onChange={handleFilterChange}
            variant="outlined"
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Tümü</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {/* Subscriptions Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Abonelik
                    <IconButton size="small" onClick={() => handleSortChange('name')}>
                      <SortIcon 
                        fontSize="small"
                        color={sorting.sort_by === 'name' ? 'primary' : 'action'}
                      />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Tutar
                    <IconButton size="small" onClick={() => handleSortChange('amount')}>
                      <SortIcon 
                        fontSize="small"
                        color={sorting.sort_by === 'amount' ? 'primary' : 'action'}
                      />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>Dönem</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Sonraki Ödeme
                    <IconButton size="small" onClick={() => handleSortChange('next_billing_date')}>
                      <SortIcon 
                        fontSize="small"
                        color={sorting.sort_by === 'next_billing_date' ? 'primary' : 'action'}
                      />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>Durum</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">
                      Abonelik bulunamadı
                    </Typography>
                    <Button 
                      variant="text" 
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/subscriptions/add')}
                      sx={{ mt: 1 }}
                    >
                      Abonelik Ekle
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription.id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {subscription.name}
                      </Typography>
                      {subscription.description && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {subscription.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(subscription.amount, subscription.currency)}
                    </TableCell>
                    <TableCell>
                      {getBillingCycleLabel(subscription.billing_cycle)}
                    </TableCell>
                    <TableCell>
                      {subscription.category ? (
                        <Chip 
                          label={subscription.category.name}
                          size="small"
                          sx={{ 
                            bgcolor: subscription.category.color || theme.palette.primary.main,
                            color: theme.palette.getContrastText(subscription.category.color || theme.palette.primary.main)
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {subscription.next_billing_date ? (
                        format(new Date(subscription.next_billing_date), 'PPP', { locale: tr })
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(subscription.status)}
                        color={getStatusColor(subscription.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Görüntüle">
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/subscriptions/${subscription.id}`)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Düzenle">
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/subscriptions/${subscription.id}/edit`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton 
                          size="small"
                          onClick={() => handleDeleteClick(subscription)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Sayfa başına satır:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Aboneliği Sil"
        content={`"${subscriptionToDelete?.name}" aboneliğini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Box>
  );
};

export default SubscriptionsPage;
