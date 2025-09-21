# Shiv Accounts - Modern Accounting Management System

A comprehensive accounting and inventory management system built with modern web technologies.

## Overview

Shiv Accounts is a feature-rich accounting application designed for small to medium businesses. It provides complete financial management capabilities including invoicing, purchase orders, inventory tracking, payment processing, and comprehensive reporting.

## Key Features

- **👥 Contact Management**: Customer and vendor management with detailed profiles
- **📦 Inventory Management**: Product catalog with stock tracking and HSN codes
- **📄 Invoice Management**: Create, send, and track invoices with multiple status workflows
- **🛒 Purchase Orders**: Complete purchase order lifecycle management
- **💳 Payment Gateway**: Integrated Razorpay payment processing
- **📊 Financial Reports**: Comprehensive reporting and analytics
- **📚 Ledger Management**: Double-entry bookkeeping with audit trails
- **🔐 Role-Based Access**: Multi-user support with permission management
- **📱 Responsive Design**: Mobile-first design that works on all devices
- **🔄 Real-time Updates**: Live data synchronization across all modules

## Technology Stack

This project is built with modern technologies:

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite for fast development and building
- **State Management**: React Context API with useReducer
- **Database**: Supabase (PostgreSQL) with local fallback
- **Payments**: Razorpay integration for secure payment processing
- **Authentication**: Supabase Auth with role-based access control

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shiv-accounts-ui-98-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Copy the environment variables and update with your credentials:
   ```bash
   cp .env.example .env
   ```

   Update the following variables in `.env`:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Razorpay Configuration
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   VITE_RAZORPAY_KEY_SECRET=your_razorpay_key_secret

   # API Configuration
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Start the backend server** (for payment processing)
   ```bash
   cd backend
   npm install
   npm start
   ```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components (Sidebar, MainLayout)
│   └── ui/             # shadcn/ui components
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
├── pages/              # Page components
│   ├── masters/        # Master data pages (Products, Contacts, etc.)
│   └── transactions/   # Transaction pages (Invoices, PO, etc.)
├── store/              # Global state management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## User Roles & Permissions

- **SuperUser**: Full system access and management
- **Admin**: Complete business operations access
- **InvoicingUser**: Invoice and payment management
- **ContactMaster**: Contact and basic data management

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Style

This project uses:
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting
- Conventional commit messages

## Deployment

### Production Build

```bash
npm run build
```

The built files will be in the `dist` directory.

### Environment Variables for Production

Ensure all environment variables are properly configured for your production environment, especially:
- Supabase production URLs and keys
- Razorpay live keys (when ready for production)
- Secure API endpoints

## Payment Integration

The application includes Razorpay payment gateway integration:

- Test mode is enabled by default
- Full payment verification and tracking
- Transaction history and reporting
- Webhook support for payment confirmations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## License

This project is proprietary software. All rights reserved.
