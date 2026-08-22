Dayflow HRMS

A modern Human Resource Management System (HRMS) built with React, TypeScript, Tailwind CSS, Vite, and Supabase.

Live Demo

Vercel: [https://dayflow-ni-gathon.vercel.app](https://dayflow-lbhjo9qii-ni-gathon.vercel.app/)

Features

Supabase authentication

Automatic employee ID generation

Automatic HR admin assignment for .admin email addresses

Employee directory and profiles

Employee profile editing

Attendance and check-in/check-out

Break tracking

Leave requests and approval workflow

Leave balance validation

Half-day leave support

Payroll and payslip generation

Notifications

Reports and analytics

Dark/light mode

Responsive dashboard

Supabase-backed database

Tech Stack

React

TypeScript

Vite

Tailwind CSS

Supabase

Lucide React

Canvas Confetti

Live Application

Visit the deployed application:

https://dayflow-ni-gathon.vercel.app

Local Setup

Clone the repository:

git clone <your-repository-url>
cd dayflow

Install dependencies:

npm install

Create .env.local in the project root:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

Start the development server:

npm run dev

Production Build

npm run build

To preview the production build locally:

npm run preview

Authentication

Accounts are managed with Supabase Auth.

Employee IDs are generated automatically by the database.

Emails whose local part ends with .admin are assigned HR administrator access.

Examples:

sun.admin@gmail.com     -> Admin
john.admin@example.com  -> Admin
john@gmail.com          -> Employee

Supabase

Supabase is used for:

Authentication

Employee records

Attendance

Leave requests

Payslips

Notifications

Audit/login data

Database setup and policy SQL files are included in the project where applicable.

Environment Variables

Do not commit .env.local to GitHub.

Required variables:

VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY

For Vercel, add these in:

Vercel → Project → Settings → Environment Variables

Redeploy after changing environment variables.

Project Structure

dayflow/
├── src/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── lib/
│   └── types/
├── public/
├── package.json
├── vite.config.*
└── README.md

Team

Dayflow HRMS was developed as a collaborative project.

License

This project is intended for educational/project use.
