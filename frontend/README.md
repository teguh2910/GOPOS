# GoPOS Frontend - Next.js

This is the new Next.js frontend for the GoPOS application, migrated from vanilla HTML/CSS/JavaScript.

## Features

- **Modern React/Next.js Architecture**: Built with Next.js 15, React 19, and TypeScript
- **Tailwind CSS Styling**: Clean, responsive design with Tailwind CSS
- **Component-Based Structure**: Reusable components for better maintainability
- **Type Safety**: Full TypeScript support with proper type definitions
- **Authentication Context**: Centralized authentication state management
- **API Integration**: Structured API service layer for backend communication

## Pages

- **Login/Register**: User authentication and registration
- **POS Interface**: Point of sale with product grid and shopping cart
- **Product Management**: CRUD operations for products
- **Customer Management**: CRUD operations for customers
- **Reports Dashboard**: Sales analytics and reporting

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## API Integration

The frontend communicates with the Go backend API at `/api/*` endpoints. The API service layer handles:

- Products CRUD operations
- Customers CRUD operations
- Sales/checkout processing
- User registration
- Sales reporting

## Migration Notes

This frontend maintains full feature parity with the original vanilla JavaScript implementation:

- ✅ User authentication (simple ID-based login)
- ✅ Product management with CRUD operations
- ✅ Customer management with CRUD operations
- ✅ POS interface with cart and checkout
- ✅ Sales reporting with date filtering
- ✅ Responsive design
- ✅ Error handling and loading states

## Development vs Production

For development, run both the Go backend (port 8081) and Next.js frontend (port 3000) separately.

For production, the Next.js app can be built as static files and served by the Go backend.
