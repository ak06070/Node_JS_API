const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database_name',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.connect((err) => {
  if (err) {
      console.error('Error connecting to the database:', err);
      return;
  }
  console.log('Connected to the database');
});

// 1. Register

app.post('/api/register', (req, res) => {
  const { teacher, students } = req.body;

  // Insert teacher if not exists

  db.query('INSERT IGNORE INTO teachers (email) VALUES (?)', [teacher], (err) => {
      if (err) return res.status(500).json({ message: 'Database error' });

      // Insert students if not exists and register them to the teacher

      students.forEach(student => {
          db.query('INSERT IGNORE INTO students (email) VALUES (?)', [student], (err) => {
              if (err) return res.status(500).json({ message: 'Database error' });

              // Link teacher and students

              db.query(`
                  INSERT IGNORE INTO teacher_student (teacher_id, student_id)
                  SELECT t.id, s.id
                  FROM teachers t, students s
                  WHERE t.email = ? AND s.email = ?
              `, [teacher, student], (err) => {
                  if (err) return res.status(500).json({ message: 'Database error' });
              });
          });
      });
      res.status(204).send();
  });
});

// 2. Common students

app.get('/api/commonstudents', (req, res) => {
  const teachers = req.query.teacher;

  if (!teachers) return res.status(400).json({ message: 'No teachers provided' });

  const query = `
      SELECT s.email FROM students s
      JOIN teacher_student ts ON s.id = ts.student_id
      JOIN teachers t ON ts.teacher_id = t.id
      WHERE t.email IN (?)
      GROUP BY s.id
      HAVING COUNT(DISTINCT t.id) = ?
  `;

  const teacherEmails = Array.isArray(teachers) ? teachers : [teachers];
  db.query(query, [teacherEmails, teacherEmails.length], (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.status(200).json({ students: results.map(r => r.email) });
  });
});

// 3. Suspend

app.post('/api/suspend', (req, res) => {
  const { student } = req.body;

  db.query('UPDATE students SET suspended = TRUE WHERE email = ?', [student], (err) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.status(204).send();
  });
});

// 4. Notifications

app.post('/api/retrievefornotifications', (req, res) => {
  const { teacher, notification } = req.body;

  // Extract mentioned students from the notification

  const mentionedStudents = notification.match(/@(\S+@\S+)/g) || [];
  const mentionedEmails = mentionedStudents.map(s => s.substring(1));

  const query = `
      SELECT DISTINCT s.email FROM students s
      LEFT JOIN teacher_student ts ON s.id = ts.student_id
      LEFT JOIN teachers t ON ts.teacher_id = t.id
      WHERE (t.email = ? OR s.email IN (?)) AND s.suspended = FALSE
  `;

  db.query(query, [teacher, mentionedEmails], (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      res.status(200).json({ recipients: results.map(r => r.email) });
  });
});

// Export the app for testing

  module.exports = app;

// Start the server only if this file is run directly

if (require.main === module) {
  const PORT = 3000;
  app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
  });
}