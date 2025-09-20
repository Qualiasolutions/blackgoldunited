// BGU ERP System - Component Exports

// Layout Components
export { MainLayout } from './layout/main-layout'
export { Sidebar } from './layout/sidebar'
export { Header } from './layout/header'

// Dashboard Components
export { DashboardPage } from './dashboard/dashboard-page'
export { QuickActions } from './dashboard/quick-actions'
export { SummaryWidgets } from './dashboard/summary-widgets'

// Authentication & Authorization
export { RoleGuard, PermissionWrapper } from './auth/role-guard'
export { ProtectedRoute } from './auth/protected-route'

// Data Table
export { DataTable } from './data-table/data-table'

// UI Components
export { Button } from './ui/button'
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
export { Input } from './ui/input'
export { Label } from './ui/label'
export { Badge } from './ui/badge'
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
export { Textarea } from './ui/textarea'
export { Progress } from './ui/progress'
export { ScrollArea } from './ui/scroll-area'
export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
export { LoadingSpinner, LoadingState, ErrorState, EmptyState } from './ui/loading'

// Module Components - Sales
export { InvoiceList } from './modules/sales/invoice-list'
export { InvoiceForm } from './modules/sales/invoice-form'

// Module Components - Clients
export { ClientList } from './modules/clients/client-list'

// Module Components - Inventory
export { ProductList } from './modules/inventory/product-list'

// Module Components - Purchase
export { SupplierList } from './modules/purchase/supplier-list'