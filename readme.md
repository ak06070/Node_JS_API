# Node_JS API Development

This is a Node.js API that allows teachers to perform administrative functions for their students. The API supports registering students, retrieving common students, suspending students, and retrieving students for notifications.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
   - [Database Setup](#database-setup)
   - [Project Setup](#project-setup)
3. [Running the API](#running-the-api)
4. [API Endpoints](#api-endpoints)
5. [Postman Collection](#postman-collection)
6. [Database Queries](#database-queries)
7. [Running Tests](#running-tests)

---

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **MySQL** (v8.0 or higher)
- **Git** (optional, for cloning the repository)

---

## Setup

### Database Setup

1. **Create a MySQL Database:**
   - Log in to your MySQL server:
     ```bash
     mysql -u root -p
     ```
   - Create a new database:
     ```sql
     CREATE DATABASE teacher_student_db;
     USE teacher_student_db;
     ```

2. **Create Tables:**
   - Run the following SQL queries to create the necessary tables:
     ```sql
     CREATE TABLE teachers (
         id INT AUTO_INCREMENT PRIMARY KEY,
         email VARCHAR(255) UNIQUE NOT NULL
     );

     CREATE TABLE students (
         id INT AUTO_INCREMENT PRIMARY KEY,
         email VARCHAR(255) UNIQUE NOT NULL,
         suspended BOOLEAN DEFAULT FALSE
     );

     CREATE TABLE teacher_student (
         teacher_id INT,
         student_id INT,
         PRIMARY KEY (teacher_id, student_id),
         FOREIGN KEY (teacher_id) REFERENCES teachers(id),
         FOREIGN KEY (student_id) REFERENCES students(id)
     );
     ```

3. **Verify Tables:**
   - Check if the tables were created successfully:
     ```sql
     SHOW TABLES;
     ```

---

### Project Setup

1. **Clone the Repository:**
   - Clone the repository to your local machine:
     ```bash
     git clone https://github.com/ak06070/Node_JS_API.git
     ```

2. **Install Dependencies:**
   - Install the required Node.js packages:
     ```bash
     npm install
     ```

3. **Configure Database Connection:**
   - Open the `app.js` file and update the MySQL connection settings:
     ```javascript
     const db = mysql.createConnection({
         host: 'localhost',
         user: 'root', // Replace with your MySQL username
         password: 'password', // Replace with your MySQL password
         database: 'teacher_student_db'
     });
     ```

---

## Running the API

1. **Start the Server:**
   - Run the following command to start the API server:
     ```bash
     node server.js
     ```
   - The server will start on `http://localhost:3000`.

2. **Test the API:**
   - Use tools like **Postman** to test the API endpoints.

---

## API Endpoints

### 1. Register Students to a Teacher
- **Endpoint:** `POST /api/register`
- **Request Body:**
  ```json
  {
    "teacher": "teachertest1@gmail.com",
    "students": [
      "studenttest1@gmail.com",
      "studenttest2@gmail.com"
    ]
  }

### 2. Retrieve Common Students
- **Endpoint:** `GET /api/commonstudents?teacher=teachertest1@gmail.com&teacher=teachertest2@gmail.com`
- **Request Body:**
  ```json
  {
    "students": [
        "commonstudent1@gmail.com",
        "commonstudent2@gmail.com"
    ]
  }

### 3. Suspend a Student
- **Endpoint:** `POST /api/suspend`
- **Request Body:**
  ```json
    {
        "student": "teachertest1@gmail.com"
    }

### 4. Retrieve Students for Notifications
- **Endpoint:** `POST /api/retrievefornotifications`
- **Request Body:**
  ```json
    {
    "teacher": "teachertest1@gmail.com",
    "notification": "Hello students! @studenttest1@gmail.com @studenttest2@gmail.com"
    }

- **Success Response:**
  ```json
    {
        "recipients": [
            "studenttest1@gmail.com",
            "studenttest2@gmail.com",
            "studenttest3@gmail.com"
        ]
    }

---

## Postman Collection

  ### -- A file with name [postman_collection.json](postman_collection.json) is available in the project directory, download or copy the content and import it into postman to get access to the api endpoints.

---

## Database Queries

```SQL
    ### -- Insert teacher if not exists

INSERT IGNORE INTO teachers (email) VALUES ('teachertest1@gmail.com');

    ### -- Insert students if not exists

INSERT IGNORE INTO students (email) VALUES ('studenttest1@gmail.com'), ('studenttest2@gmail.com');

    ### -- Register students to the teacher

INSERT IGNORE INTO teacher_student (teacher_id, student_id)
SELECT t.id, s.id
FROM teachers t, students s
WHERE t.email = 'teachertest1@gmail.com'
AND s.email IN ('studenttest1@gmail.com', 'studenttest2@gmail.com');

    ### -- Retrieve Common Students

SELECT s.email
FROM students s
JOIN teacher_student ts ON s.id = ts.student_id
JOIN teachers t ON ts.teacher_id = t.id
WHERE t.email IN ('teachertest1@gmail.com', 'teachertest2@gmail.com')
GROUP BY s.id
HAVING COUNT(DISTINCT t.id) = 2;

    ### -- Suspend a Student

UPDATE students
SET suspended = TRUE
WHERE email = 'studenttest3@gmail.com';

    ### --- Retrive Students for Notifications

SELECT DISTINCT s.email
FROM students s
LEFT JOIN teacher_student ts ON s.id = ts.student_id
LEFT JOIN teachers t ON ts.teacher_id = t.id
WHERE (t.email = 'teachertest1@gmail.com' OR s.email IN ('studenttest4@gmail.com', 'studenttest5@gmail.com'))
AND s.suspended = FALSE;
```

---

## Running Tests

1. **Install Dependencies**
   - Install the required Node.js packages:
    ```bash
    npm install --save-dev jest supertest
    ```
2. **Command to run Test**
   - Use the below command to execute the tests:
   ```bash
   npm test
   ```
---
