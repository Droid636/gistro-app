const express = require("express");
const multer = require("multer");
const path = require("path");
const { mysqlConnection, UserModel } = require("./db");

const app = express();
const PORT = 5000;

// Middleware para archivos estáticos
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📸 Configuración de Multer para subir imágenes
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// 📌 Ruta para recibir el formulario
app.post("/register", upload.single("image"), async (req, res) => {
    try {
        const { text_field, password, date_field, opinion, database } = req.body;
        const image = req.file ? req.file.filename : null;

        console.log("📥 Recibida solicitud de registro:", req.body);

        if (!text_field || !password) {
            return res.status(400).json({ message: "Los campos text_field y password son obligatorios" });
        }

        if (database === "mysql") {
            const query = "INSERT INTO users (text_field, password, image, date_field, opinion) VALUES (?, ?, ?, ?, ?)";

            mysqlConnection.query(query, [text_field, password, image, date_field, opinion], (err, result) => {
                if (err) {
                    console.error("❌ Error al insertar en MySQL:", err);
                    return res.status(500).json({ message: "Error en MySQL" });
                }
                console.log("✅ Registro guardado en MySQL:", result);
                res.json({ message: "Registro guardado en MySQL" });
            });
        } else if (database === "mongodb") {
            try {
                const newUser = new UserModel({
                    text_field,
                    password,
                    image,
                    date_field: date_field ? new Date(date_field) : null,
                    opinion
                });

                const savedUser = await newUser.save();
                console.log("✅ Registro guardado en MongoDB:", savedUser);
                res.json({ message: "Registro guardado en MongoDB" });
            } catch (mongoError) {
                console.error("❌ Error al insertar en MongoDB:", mongoError);
                res.status(500).json({ message: "Error en MongoDB", error: mongoError.message });
            }
        } else {
            res.status(400).json({ message: "Base de datos no especificada" });
        }
    } catch (error) {
        console.error("❌ Error en el servidor:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// 🚀 Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
