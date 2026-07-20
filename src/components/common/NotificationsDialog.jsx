"use client";
import React from 'react';
import {
  Popover,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Chip,
  Avatar,
  Badge
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTheme } from '../../context/ThemeContext';
import { useGetRecentCronLogsSummaryQuery } from '../../features/api/cronLogApi';
import moment from 'moment';

const NotificationsDialog = ({ anchorEl, onClose }) => {
  const { isDarkMode } = useTheme();
  const { data: responseData, isLoading, error } = useGetRecentCronLogsSummaryQuery();

  const [frozenLogs, setFrozenLogs] = React.useState(null);
  const open = Boolean(anchorEl);

  React.useEffect(() => {
    if (open && responseData?.data && frozenLogs === null) {
      setFrozenLogs(responseData.data.filter(l => !l.is_read));
    } else if (!open) {
      setFrozenLogs(null);
    }
  }, [open, responseData, frozenLogs]);

  const logs = frozenLogs || [];
  const failedLogs = logs.filter(log => log.type === 'CRON_FAILURE' || log.type === 'FAILED_LOG');
  
  const getStatusDisplay = (type) => {
    if (type === 'CRON_SUCCESS') return 'SUCCESS';
    if (type === 'CRON_FAILURE' || type === 'FAILED_LOG') return 'FAILURE';
    return type || 'INFO';
  };

  const getStatusIcon = (type) => {
    const status = getStatusDisplay(type);
    if (status === 'SUCCESS') return <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#28c76f' }} />;
    if (status === 'FAILURE') return <ErrorOutlineIcon fontSize="small" sx={{ color: '#ea5455' }} />;
    return <InfoOutlinedIcon fontSize="small" sx={{ color: '#00cfe8' }} />;
  };

  const renderMessage = (message) => {
    try {
      const parsed = JSON.parse(message);
      return (
        <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {Object.entries(parsed).map(([key, value]) => (
            <Typography key={key} variant="caption" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', display: 'flex', gap: 1 }}>
              <strong style={{ color: isDarkMode ? '#e2e8f0' : '#475569' }}>{key}:</strong> 
              <span style={{ wordBreak: 'break-all' }}>{String(value)}</span>
            </Typography>
          ))}
        </Box>
      );
    } catch (e) {
      return (
        <Typography variant="body2" sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b', fontSize: '0.8rem', mt: 0.5, wordBreak: 'break-word' }}>
          {message}
        </Typography>
      );
    }
  };

  return (
    <Popover 
      open={open} 
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      slotProps={{
        paper: {
          sx: {
            width: { xs: 320, sm: 400 },
            backgroundColor: isDarkMode ? '#283046' : '#ffffff',
            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
            borderRadius: '12px',
            mt: 1.5,
            boxShadow: isDarkMode 
                ? '0 10px 30px 0 rgba(0,0,0,0.5), 0 1px 3px 0 rgba(0,0,0,0.5)' 
                : '0 10px 30px 0 rgba(34,41,47,0.15), 0 1px 3px 0 rgba(34,41,47,0.05)',
            border: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`,
            overflow: 'hidden'
          }
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2.5,
        backgroundColor: isDarkMode ? 'rgba(115, 103, 240, 0.08)' : 'rgba(115, 103, 240, 0.04)',
        borderBottom: `1px solid ${isDarkMode ? '#3b4253' : '#ebe9f1'}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#7367f0', width: 36, height: 36 }}>
                <NotificationsActiveIcon fontSize="small" sx={{ color: '#fff' }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: isDarkMode ? '#e2e8f0' : '#1e293b', fontSize: '1.1rem' }}>
                Notifications
            </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ 
            color: isDarkMode ? '#a3a8b7' : '#6e6b7b',
            '&:hover': { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
        }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Box sx={{ minHeight: '300px', maxHeight: '500px', overflowY: 'auto', p: 0,
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: isDarkMode ? '#4b5563' : '#cbd5e1', borderRadius: '4px' },
      }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <CircularProgress size={30} sx={{ color: '#7367f0' }} />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <Typography color="error">Failed to load notifications</Typography>
          </Box>
        ) : logs.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '300px', gap: 2, opacity: 0.7 }}>
            <NotificationsActiveIcon sx={{ fontSize: 48, color: isDarkMode ? '#4b5563' : '#cbd5e1' }} />
            <Typography sx={{ fontWeight: 500 }}>No recent notifications</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            
            {failedLogs.length > 0 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#ea5455', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                  Critical Alerts
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {failedLogs.map((log) => (
                    <Box key={log.id} sx={{ 
                      p: 2, 
                      borderRadius: '8px', 
                      bgcolor: isDarkMode ? 'rgba(234, 84, 85, 0.08)' : 'rgba(234, 84, 85, 0.05)',
                      borderLeft: '4px solid #ea5455',
                      boxShadow: isDarkMode ? 'inset 0 0 0 1px rgba(234, 84, 85, 0.2)' : 'inset 0 0 0 1px rgba(234, 84, 85, 0.1)',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: isDarkMode ? 'rgba(234, 84, 85, 0.12)' : 'rgba(234, 84, 85, 0.08)' }
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ErrorOutlineIcon fontSize="small" sx={{ color: '#ea5455' }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                            {log.title}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 500 }}>
                          {moment(log.created_at).fromNow()}
                        </Typography>
                      </Box>
                      {renderMessage(log.message)}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {failedLogs.length > 0 && (
              <Divider sx={{ borderColor: isDarkMode ? '#3b4253' : '#ebe9f1' }} />
            )}
            
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: isDarkMode ? '#a3a8b7' : '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                All Notifications
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {logs.slice(0, 15).map((log) => (
                  <Box key={log.id} sx={{ 
                    p: 1.5, 
                    borderRadius: '8px', 
                    bgcolor: 'transparent',
                    border: `1px solid transparent`,
                    transition: 'all 0.2s',
                    '&:hover': { 
                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                        borderColor: isDarkMode ? '#3b4253' : '#ebe9f1'
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box sx={{ mt: 0.5 }}>
                        {getStatusIcon(log.type)}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#e2e8f0' : '#1e293b' }}>
                              {log.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isDarkMode ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap', ml: 2 }}>
                              {moment(log.created_at).format('MMM DD, HH:mm')}
                            </Typography>
                        </Box>
                        {renderMessage(log.message)}
                      </Box>
                    </Box>
                  </Box>
                ))}
                {logs.length > 15 && (
                  <Typography variant="caption" sx={{ textAlign: 'center', mt: 2, mb: 1, color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 500 }}>
                    Showing first 15 of {logs.length} notifications.
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Popover>
  );
};

export default NotificationsDialog;

