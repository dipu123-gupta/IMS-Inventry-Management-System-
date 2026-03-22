import { 
  Box, 
  ShoppingCart, 
  Truck, 
  Users, 
  BarChart3, 
  Settings, 
  Package, 
  FileText, 
  Receipt, 
  RotateCcw, 
  UserPlus, 
  Layers, 
  AlertTriangle,
  LayoutDashboard,
  Wallet,
  History,
  ShieldCheck
} from 'lucide-react';

export const footerNavigation = [
  {
    category: "Inventory Management",
    links: [
      { name: "Items", path: "/products", icon: Package },
      { name: "Adjustments", path: "/inventory", icon: Layers },
      { name: "Warehouses", path: "/warehouses", icon: Box },
      { name: "Transfers", path: "/transfers", icon: Truck },
      { name: "Expiry Alerts", path: "/expiry", icon: AlertTriangle },
    ]
  },
  {
    category: "Sales",
    links: [
      { name: "Customers", path: "/customers", icon: Users },
      { name: "Quotes", path: "/quotes", icon: FileText },
      { name: "Sales Orders", path: "/sales-orders", icon: ShoppingCart },
      { name: "Invoices", path: "/invoices", icon: Receipt },
      { name: "Returns", path: "/returns", icon: RotateCcw },
    ]
  },
  {
    category: "Purchases",
    links: [
      { name: "Vendors", path: "/vendors", icon: UserPlus },
      { name: "Purchase Orders", path: "/purchase-orders", icon: ShoppingCart },
      { name: "Purchase Bills", path: "/billing", icon: Receipt },
    ]
  },
  {
    category: "Finance",
    links: [
      { name: "Dashboard", path: "/finance", icon: Wallet },
      { name: "Expenses", path: "/expenses", icon: Receipt },
      { name: "Reports", path: "/reports", icon: BarChart3 },
    ]
  },
  {
    category: "Administration",
    links: [
      { name: "Users & Roles", path: "/users", icon: Users },
      { name: "Activity Logs", path: "/activity-logs", icon: History },
      { name: "Security", path: "/security", icon: ShieldCheck },
    ]
  }
];

export const quickActions = [
  { name: "Quick Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Notifications", path: "/notifications", icon: AlertTriangle },
];
