const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer'); // 📧 Mail için eklendi

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Veritabanı oluştur
const db = new sqlite3.Database('randevular.db');

db.run(`CREATE TABLE IF NOT EXISTS randevular (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    tc TEXT,
    phone TEXT,
    email TEXT,
    type TEXT,
    date TEXT,
    time TEXT,
    note TEXT
)`);

// Randevu alma işlemi
app.post('/randevu', (req, res) => {
    const { name, tc, phone, email, type, date, time, note } = req.body;

    db.get(`SELECT * FROM randevular WHERE date = ? AND time = ?`, [date, time], (err, row) => {
        if (row) {
            return res.status(400).json({ message: "Bu saat dolu!" });
        }

        db.run(`INSERT INTO randevular (name, tc, phone, email, type, date, time, note) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, tc, phone, email, type, date, time, note],
            (err) => {
                if (err) {
                    return res.status(500).json({ message: "Hata oldu." });
                }

                // 📧 BURADA E-POSTA GÖNDERİLİYOR
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'uttsmez@gmail.com',
                        pass: 'aoivpweccwzvhcea'
                    }
                });

                const mailOptions = {
                    from: 'uttsmez@gmail.com',
                    to: 'uttsmez@gmail.com',
                    subject: 'Yeni Randevu Alındı',
                    text: `
Yeni bir randevu alındı:

Ad Soyad: ${name}
TC: ${tc}
Telefon: ${phone}
E-Posta: ${email}
Tür: ${type}
Tarih: ${date}
Saat: ${time}
Not: ${note}
                    `
                };

                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        console.log("Mail gönderilemedi:", error);
                    } else {
                        console.log("Mail gönderildi:", info.response);
                    }
                });

                res.json({ message: "Randevu başarıyla alındı." });
            });
    });
});

// Tüm randevuları listeleme (admin panel için)
app.get('/randevular', (req, res) => {
    db.all("SELECT * FROM randevular ORDER BY date, time", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Veri alınamadı." });
        }
        res.json(rows);
    });
});

app.listen(3000, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
