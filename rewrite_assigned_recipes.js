const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('src/pages_old/admin/recipe management/AssignedRecipes.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Remove AG Grid imports
content = content.replace(/import\s+{\s*AgGridReact\s*}\s+from\s+["']ag-grid-react["'];\n/g, '');
content = content.replace(/import\s+{\s*ModuleRegistry,\s*AllCommunityModule\s*}\s+from\s+["']ag-grid-community["'];\n/g, '');
content = content.replace(/import\s+["']ag-grid-community\/styles\/ag-grid\.css["'];\n/g, '');
content = content.replace(/import\s+["']ag-grid-community\/styles\/ag-theme-alpine\.css["'];\n/g, '');
content = content.replace(/ModuleRegistry\.registerModules\(\[AllCommunityModule\]\);\n/g, '');

// 2. Add Table imports
if (!content.includes('TableContainer')) {
  content = content.replace(
    /Tooltip,\n} from "@mui\/material";/,
    `Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";`
  );
}

// 3. Remove columnDefs and defaultColDef
content = content.replace(/const columnDefs = useMemo\([\s\S]*?\n  \);\n\n  const defaultColDef = useMemo\([\s\S]*?\n  \);\n/, '');

// 4. Replace AG Grid block with Native MUI Table
const tableCode = `
            {/* ── Native Table ───────────────────────────────────────────────── */}
            <TableContainer 
                sx={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'auto',
                    backgroundColor: 'transparent',
                    '&::-webkit-scrollbar': { width: '8px', height: '8px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { 
                        background: isDarkMode ? '#404656' : '#c1c1c1', 
                        borderRadius: '4px' 
                    },
                    '&::-webkit-scrollbar-thumb:hover': { 
                        background: isDarkMode ? '#505666' : '#a8a8a8' 
                    }
                }}
            >
                <Table stickyHeader sx={{ minWidth: 1000, borderCollapse: 'separate', borderSpacing: 0 }}>
                    <TableHead>
                        <TableRow>
                            {['#', 'Recipe name', 'Status', 'Assigned to', 'Category', 'Sub-category', 'Created', ...(canUpdate || canDelete ? ['Actions'] : [])].map((headCell, index) => (
                                <TableCell 
                                    key={index}
                                    align="center"
                                    sx={{
                                        backgroundColor: isDarkMode ? '#283046' : '#f3f2f7',
                                        color: isDarkMode ? '#b4b7bd' : '#6e6b7b',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        borderBottom: \`1px solid \${isDarkMode ? '#3b4253' : '#ebe9f1'}\`,
                                        py: 2,
                                    }}
                                >
                                    {headCell}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading || isFetching ? (
                            <TableRow>
                                <TableCell colSpan={canUpdate || canDelete ? 8 : 7} align="center" sx={{ py: 8 }}>
                                    <CircularProgress size={40} sx={{ color: '#7367f0' }} />
                                    <Typography sx={{ mt: 2, color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>Loading...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : tableRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={canUpdate || canDelete ? 8 : 7} align="center" sx={{ py: 8 }}>
                                    <Typography sx={{ color: isDarkMode ? '#b4b7bd' : '#6e6b7b' }}>No assigned recipes found</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            tableRows.map((row, index) => {
                                const statusVal = row.status || "assigned";
                                const statusColor = statusColors[statusVal] || (isDarkMode ? "#e5e7eb" : "#374151");
                                
                                return (
                                <TableRow 
                                    key={row.id || index}
                                    sx={{
                                        backgroundColor: index % 2 === 0 ? (isDarkMode ? '#283046' : '#ffffff') : (isDarkMode ? '#283046' : '#fafbfc'),
                                        transition: 'background-color 0.2s ease',
                                        '&:hover': {
                                            backgroundColor: isDarkMode ? '#2f3851 !important' : '#f8f8f8 !important',
                                        },
                                        '& td': {
                                            borderBottom: \`1px solid \${isDarkMode ? '#3b4253' : '#ebe9f1'}\`,
                                            color: isDarkMode ? '#d0d2d6' : '#6e6b7b',
                                            py: 1.5,
                                        }
                                    }}
                                >
                                    <TableCell align="center">
                                        {(page - 1) * limit + index + 1}
                                    </TableCell>
                                    
                                    <TableCell align="center">
                                        <Box className="flex gap-2 items-center justify-center h-full">
                                            <Typography variant="body2">{row.recipe_name || "-"}</Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleCopyRecipeName(row.recipe_name)}
                                                sx={{
                                                    color: isDarkMode ? "#3b82f6" : "#2563eb",
                                                    padding: "4px",
                                                    "&:hover": {
                                                        backgroundColor: isDarkMode ? "#1e3a8a" : "#dbeafe",
                                                    },
                                                }}
                                                title="Copy recipe name"
                                            >
                                                <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Typography
                                            variant="body2"
                                            sx={{ color: statusColor, fontWeight: "bold" }}
                                        >
                                            {statusLabel(statusVal)}
                                        </Typography>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Box sx={{ textAlign: "center", lineHeight: 1.35 }}>
                                            <Typography variant="body2">{row.assigned_user_name || "-"}</Typography>
                                            <Typography variant="caption" sx={{ display: "block", opacity: 0.8 }}>
                                                {row.assigned_user_email || (row.assign_user_id ? \`ID: \${row.assign_user_id}\` : "Unassigned")}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    <TableCell align="center">
                                        {row.category_name || "-"}
                                    </TableCell>

                                    <TableCell align="center">
                                        {row.sub_category_name || "-"}
                                    </TableCell>

                                    <TableCell align="center">
                                        {row.created_at ? moment(row.created_at).format("MMM D, YYYY HH:mm") : "-"}
                                    </TableCell>

                                    {(canUpdate || canDelete) && (
                                        <TableCell align="center">
                                            <Box className="flex gap-2 justify-center items-center h-full">
                                                <Tooltip title="View" arrow>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleOpenView(row)}
                                                        sx={{
                                                            color: isDarkMode ? "#10b981" : "#059669",
                                                            "&:hover": {
                                                                backgroundColor: isDarkMode ? "#064e3b" : "#d1fae5",
                                                            },
                                                        }}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                
                                                {canUpdate && (
                                                    <Tooltip title="Edit" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenEdit(row)}
                                                            sx={{
                                                                color: isDarkMode ? '#3b82f6' : '#2563eb',
                                                                '&:hover': {
                                                                    backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe',
                                                                },
                                                            }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                
                                                {canDelete && (
                                                    <Tooltip title="Delete" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setDeleteId(row.id)}
                                                            sx={{
                                                                color: isDarkMode ? '#ef4444' : '#dc2626',
                                                                '&:hover': {
                                                                    backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
                                                                },
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                    )}
                                </TableRow>
                            )})
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
`;

const agGridRegex = /\{\/\* ── AG Grid ───────────────────────────────────────────────── \*\/\}[\s\S]*?<\/AgGridReact>\s*<\/Box>/;
content = content.replace(agGridRegex, tableCode);

// 5. Fix Autocomplete warnings by adding getOptionLabel
content = content.replace(/options=\{\[10, 25, 50, 100, 150, 200, 250, 300, 350\]\}/g, 'options={[10, 25, 50, 100, 150, 200, 250, 300, 350]}\n                        getOptionLabel={(option) => String(option)}');


fs.writeFileSync(targetPath, content, 'utf8');
console.log("Successfully rewrote AssignedRecipes.jsx to use MUI Table.");
