const request = require('supertest');
const app = require('./server');
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'Your_Username',
    password: 'Your_Password',
    database: 'teacher_student_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});


// Test data
const teacherEmail = 'teachertest1@gmail.com';
const studentEmails = ['studenttest1@gmail.com', 'studenttest2@gmail.com'];
const suspendedStudentEmail = 'studenttest3@gmail.com';

describe('Teacher-Student API', () => {
    beforeAll(async () => {
        // Clear the database before running tests
        await db.promise().query('DELETE FROM teacher_student');
        await db.promise().query('DELETE FROM students');
        await db.promise().query('DELETE FROM teachers');
    });

    afterAll(async () => {
        // Close the database connection after all tests
        await db.end();
    });

    beforeEach(async () => {
        // Register students to the teacher before each test
        await request(app)
            .post('/api/register')
            .send({
                teacher: teacherEmail,
                students: studentEmails
            });
    });

    // Test 1: Register students to a teacher
    it('should register students to a teacher', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({
                teacher: teacherEmail,
                students: studentEmails
            });
        expect(res.statusCode).toEqual(204);
    });

    // Test 2: Retrieve common students for a single teacher
    it('should retrieve common students for a single teacher', async () => {
        const res = await request(app)
            .get('/api/commonstudents')
            .query({ teacher: teacherEmail });
        expect(res.statusCode).toEqual(200);
        expect(res.body.students).toEqual(expect.arrayContaining(studentEmails));
    });

    // Test 3: Retrieve common students for multiple teachers
    it('should retrieve common students for multiple teachers', async () => {
        const secondTeacherEmail = 'teachertest2@gmail.com';
        const commonStudentEmail = 'commonstudent1@gmail.com';

        // Register a common student to both teachers
        await request(app)
            .post('/api/register')
            .send({
                teacher: secondTeacherEmail,
                students: [commonStudentEmail]
            });
        await request(app)
            .post('/api/register')
            .send({
                teacher: teacherEmail,
                students: [commonStudentEmail]
            });

        const res = await request(app)
            .get('/api/commonstudents')
            .query({ teacher: [teacherEmail, secondTeacherEmail] });
        expect(res.statusCode).toEqual(200);
        expect(res.body.students).toEqual([commonStudentEmail]);
    });

    // Test 4: Suspend a student
    it('should suspend a student', async () => {
        // Register the student first
        await request(app)
            .post('/api/register')
            .send({
                teacher: teacherEmail,
                students: [suspendedStudentEmail]
            });
    
        // Suspend the student
        const res = await request(app)
            .post('/api/suspend')
            .send({
                student: suspendedStudentEmail
            });
        expect(res.statusCode).toEqual(204);
    
        // Verify the student is suspended
        const [rows] = await db.promise().query('SELECT suspended FROM students WHERE email = ?', [suspendedStudentEmail]);
        expect(rows[0].suspended).toEqual(1);
    });

    // Test 5: Retrieve students for notifications
    it('should retrieve students for notifications', async () => {
        const notification = `Hello students! @${suspendedStudentEmail}`;

        const res = await request(app)
            .post('/api/retrievefornotifications')
            .send({
                teacher: teacherEmail,
                notification: notification
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body.recipients).toEqual(expect.arrayContaining(studentEmails));
        expect(res.body.recipients).not.toContain(suspendedStudentEmail); // Suspended students should not be included
    });
});