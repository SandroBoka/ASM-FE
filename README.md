# ASM-FE

Frontend application for the FER Information Systems course project, planned as a React + TypeScript solution for the ASM auto service system.

## Requirements

- Node.js 20 or newer
- `npm`
- Running ASM backend for features that use real API endpoints

## Installation

```bash
npm install
```

## Environment

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Running the Application

```bash
npm run dev
```

The Vite development server will print the local application URL, usually:

```txt
http://localhost:5173
```

## Testing

The planned test suite covers the presentation layer, business layer, data access layer, and integration flows that connect the layers.

```bash
npm test
```