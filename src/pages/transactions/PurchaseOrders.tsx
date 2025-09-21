import { useState } from 'react';
import { Plus, Search, Edit2, Eye, FileText, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { mockPurchaseOrders } from '@/data/mockData';
import { PurchaseOrder, PurchaseOrderItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/rbac';
import { useAppStore } from '@/store/AppStore';

export default function PurchaseOrders() {
  const { user } = useAuth();
  const { state, dispatch } = useAppStore();
  const canEdit = hasPermission(user, 'transactions:edit');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const { toast } = useToast();

  // Use purchase orders from global state instead of local state
  const purchaseOrders = state.purchaseOrders;

  // Form state for creating new purchase order
  const [newPO, setNewPO] = useState({
    vendorId: '',
    vendorName: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    items: [] as PurchaseOrderItem[],
    notes: '',
  });

  const [newItem, setNewItem] = useState({
    productId: '',
    productName: '',
    quantity: 1,
    unitPrice: 0,
    taxPercentage: 18,
  });

  const filteredPOs = purchaseOrders.filter(po =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusVariant = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'Draft':
        return 'secondary';
      case 'Sent':
        return 'outline';
      case 'Approved':
        return 'default';
      case 'Completed':
        return 'default';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'Draft':
        return 'text-muted-foreground';
      case 'Sent':
        return 'text-warning';
      case 'Approved':
        return 'text-primary';
      case 'Completed':
        return 'text-success';
      case 'Cancelled':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getNextStatus = (currentStatus: PurchaseOrder['status']): PurchaseOrder['status'][] => {
    switch (currentStatus) {
      case 'Draft':
        return ['Sent', 'Cancelled'];
      case 'Sent':
        return ['Approved', 'Cancelled'];
      case 'Approved':
        return ['Completed', 'Cancelled'];
      case 'Completed':
        return [];
      case 'Cancelled':
        return [];
      default:
        return [];
    }
  };

  const getStatusActionText = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'Sent':
        return 'Send to Vendor';
      case 'Approved':
        return 'Approve Order';
      case 'Completed':
        return 'Mark Complete';
      case 'Cancelled':
        return 'Cancel Order';
      default:
        return status;
    }
  };

  const getStatusDescription = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'Draft':
        return 'Order is being prepared';
      case 'Sent':
        return 'Order sent to vendor';
      case 'Approved':
        return 'Order approved by vendor';
      case 'Completed':
        return 'Order fulfilled';
      case 'Cancelled':
        return 'Order cancelled';
      default:
        return '';
    }
  };

  const handleView = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsDialogOpen(true);
  };

  const handleStatusUpdate = (poId: string, newStatus: PurchaseOrder['status']) => {
    const po = purchaseOrders.find(p => p.id === poId);
    const updatedPurchaseOrders = purchaseOrders.map(po => 
      po.id === poId ? { ...po, status: newStatus } : po
    );
    dispatch({ type: 'purchaseOrders/set', payload: updatedPurchaseOrders });
    
    const statusMessages = {
      'Sent': 'Purchase order sent to vendor',
      'Approved': 'Purchase order approved',
      'Completed': 'Purchase order marked as completed',
      'Cancelled': 'Purchase order cancelled',
      'Draft': 'Purchase order set to draft'
    };
    
    toast({
      title: 'Status Updated',
      description: `${po?.poNumber}: ${statusMessages[newStatus] || `Status updated to ${newStatus}`}`,
    });
  };

  const handleCreatePO = () => {
    if (!newPO.vendorName || newPO.items.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a vendor and add at least one item.',
        variant: 'destructive',
      });
      return;
    }

    const subtotal = newPO.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = newPO.items.reduce((sum, item) => sum + (item.amount * item.taxPercentage / 100), 0);
    const total = subtotal + taxAmount;

    const purchaseOrder: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${String(purchaseOrders.length + 1).padStart(4, '0')}`,
      vendorId: newPO.vendorId || `vendor-${Date.now()}`,
      vendorName: newPO.vendorName,
      date: new Date(newPO.date),
      dueDate: new Date(newPO.dueDate),
      items: newPO.items,
      subtotal,
      taxAmount,
      total,
      status: 'Draft',
      notes: newPO.notes,
    };

    // Add to global state
    dispatch({ type: 'purchaseOrders/set', payload: [...purchaseOrders, purchaseOrder] });

    // Reset form
    setNewPO({
      vendorId: '',
      vendorName: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [],
      notes: '',
    });

    setIsCreateDialogOpen(false);
    
    toast({
      title: 'Purchase Order Created',
      description: `Purchase order ${purchaseOrder.poNumber} has been created successfully.`,
    });
  };

  const handleAddItem = () => {
    if (!newItem.productName || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all item fields with valid values.',
        variant: 'destructive',
      });
      return;
    }

    const item: PurchaseOrderItem = {
      id: `item-${Date.now()}`,
      productId: newItem.productId || `product-${Date.now()}`,
      productName: newItem.productName,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      taxPercentage: newItem.taxPercentage,
      amount: newItem.quantity * newItem.unitPrice,
    };

    setNewPO(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    // Reset item form
    setNewItem({
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      taxPercentage: 18,
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setNewPO(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage your purchase orders and vendor transactions
          </p>
        </div>
        
        <Button disabled={!canEdit} onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Purchase Order
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPOs.map((po) => (
              <TableRow key={po.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{po.poNumber}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{po.vendorName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {po.date.toLocaleDateString('en-IN')}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {po.dueDate.toLocaleDateString('en-IN')}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(po.total)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusVariant(po.status)} className={getStatusColor(po.status)}>
                      {po.status}
                    </Badge>
                    {canEdit && getNextStatus(po.status).length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {getNextStatus(po.status).map((nextStatus) => (
                            <DropdownMenuItem
                              key={nextStatus}
                              onClick={() => handleStatusUpdate(po.id, nextStatus)}
                            >
                              {getStatusActionText(nextStatus)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(po)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredPOs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No purchase orders found.</p>
        </div>
      )}

      {/* Purchase Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedPO && (
            <>
              <DialogHeader>
                <DialogTitle>Purchase Order Details</DialogTitle>
                <DialogDescription>
                  {selectedPO.poNumber} - {selectedPO.vendorName}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">Date:</span>
                    <p className="text-muted-foreground">{selectedPO.date.toLocaleDateString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Due Date:</span>
                    <p className="text-muted-foreground">{selectedPO.dueDate.toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <div className="flex items-center space-x-3 mt-1">
                    <div>
                      <Badge variant={getStatusVariant(selectedPO.status)} className="ml-2">
                        {selectedPO.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1 ml-2">
                        {getStatusDescription(selectedPO.status)}
                      </p>
                    </div>
                    {canEdit && getNextStatus(selectedPO.status).length > 0 && (
                      <div className="flex space-x-2">
                        {getNextStatus(selectedPO.status).map((nextStatus) => (
                          <Button
                            key={nextStatus}
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(selectedPO.id, nextStatus)}
                          >
                            {getStatusActionText(nextStatus)}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium">Items:</span>
                  <Table className="mt-2">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPO.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedPO.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(selectedPO.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedPO.total)}</span>
                  </div>
                </div>

                {selectedPO.notes && (
                  <div>
                    <span className="text-sm font-medium">Notes:</span>
                    <p className="text-muted-foreground">{selectedPO.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Purchase Order Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order for your vendor
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vendorName">Vendor Name *</Label>
                <Input
                  id="vendorName"
                  value={newPO.vendorName}
                  onChange={(e) => setNewPO(prev => ({ ...prev, vendorName: e.target.value }))}
                  placeholder="Enter vendor name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newPO.date}
                  onChange={(e) => setNewPO(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={newPO.dueDate}
                onChange={(e) => setNewPO(prev => ({ ...prev, dueDate: e.target.value }))}
                required
              />
            </div>

            {/* Items Section */}
            <div>
              <Label className="text-base font-semibold">Items</Label>
              
              {/* Add Item Form */}
              <div className="border rounded-lg p-4 mt-2 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="productName">Product Name</Label>
                    <Input
                      id="productName"
                      value={newItem.productName}
                      onChange={(e) => setNewItem(prev => ({ ...prev, productName: e.target.value }))}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="unitPrice">Unit Price</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxPercentage">Tax %</Label>
                    <Input
                      id="taxPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={newItem.taxPercentage}
                      onChange={(e) => setNewItem(prev => ({ ...prev, taxPercentage: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddItem} className="w-full">
                      Add Item
                    </Button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              {newPO.items.length > 0 && (
                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newPO.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Totals */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(newPO.items.reduce((sum, item) => sum + item.amount, 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(newPO.items.reduce((sum, item) => sum + (item.amount * item.taxPercentage / 100), 0))}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(newPO.items.reduce((sum, item) => sum + item.amount + (item.amount * item.taxPercentage / 100), 0))}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newPO.notes}
                onChange={(e) => setNewPO(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes or comments..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePO}>
                Create Purchase Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}