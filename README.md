# Trainee App Backend

## Overview
The Trainee App backend is a RESTful API that powers the training management system. It handles user authentication, data persistence, cohort management, and feedback evaluation. The backend supports role-based access for Prospects, Applicants, Trainees, Coaches, and Admins, ensuring secure and efficient data management.

## Key Features
1. Role-Based Management:
   - Admins can manage users, forms, cohorts, and feedback.
   - Coaches can evaluate participants and view feedback.
   - Prospects, Applicants, and Trainees have restricted access based on their roles.
2. Stage Management: Tracks participants' progress through application and training stages.
3. Data Persistence: Retains user data (even for rejected participants) for future analysis.
4. API Documentation: Swagger documentation for all API endpoints.
5. Email Notifications: Uses NodeMailer to send emails to users.

## Technologies Used
1. Express (with TypeScript) - Server framework.
2. MongoDB - NoSQL database for data storage.
3. Jest - Testing framework.
4. Joi - Data validation library.
5. Swagger - API documentation.
6. NodeMailer - Email service.

## Getting Started

These instructions will help you get a copy of the backend up and running on your local machine for development and testing purposes.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/kb21-rw/trainee-app-backend.git
```

2. Navigate to the project directory:

```bash
cd trainee-app-backend
```

3.  Install dependencies:

```shell
npm install
```
4. Get `.env` file

5. Start the development server:

```shell
npm run dev
```

Open your testing tool (postman or similar app) access the app at http://localhost:3000.
