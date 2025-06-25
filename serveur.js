// ================================
// 📦 Import des modules nécessaires
// ================================
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
const PORT = 3000;

// ================================
// ⚙️ Middleware
// ================================
app.use(cors());
app.use(express.json());

// ✅ Sert les fichiers HTML, CSS, JS
app.use(express.static(path.join(__dirname)));

// ================================
// 🔌 Connexion MySQL
// ================================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // modifie si besoin
  database: "aurora_db"
});

db.connect((err) => {
  if (err) {
    console.error("❌ Connexion échouée :", err);
  } else {
    console.log("✅ Connecté avec la bese de données");
  }
});

// ================================
// 🏠 Route test
// ================================
app.get("/", (req, res) => {
  res.send("Bienvenu sur le serveur Aurora 🏨");
});

// ================================
// 🔐 Inscription avec hachage du mot de passe
// ================================
app.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;
  const userRole = role || "client";

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Champs manquants" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
    db.query(sql, [username, email, hashedPassword, userRole], (err) => {
      if (err) return res.status(500).json({ message: "Erreur SQL" });
      res.status(200).json({ message: "Inscription réussie !" });
    });
  } catch {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ================================
// 🔓 Connexion utilisateur
// ================================
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, result) => {
    if (err) return res.status(500).json({ message: "Erreur serveur" });
    if (result.length === 0) return res.status(401).json({ message: "Email incorrect" });

    const user = result[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Mot de passe incorrect" });

    res.status(200).json({
      message: "Connexion réussie",
      username: user.username,
      role: user.role
    });
  });
});

// ================================
// 📝 Réservation client
// ================================
app.post("/reservation", (req, res) => {
  const { username, email, dateArrivee, dateDepart, chambre } = req.body;

  if (!username || !email || !dateArrivee || !dateDepart || !chambre) {
    return res.status(400).json({ message: "Champs manquants" });
  }

  const sql = `
    INSERT INTO reservation (nom_client, email, date_arrivee, date_depart, chambre)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [username, email, dateArrivee, dateDepart, chambre], (err) => {
    if (err) return res.status(500).json({ message: "Erreur SQL (réservation)" });
    res.status(200).json({ message: "Réservation effectuée" });
  });
});

// ================================
// 📋 Voir toutes les réservations (admin)
// ================================
  app.get("/admin/reservations", (req, res) => {
  const sql = "SELECT id, username, date-arrivee, date-depart, chambre FROM reservation"; 
  db.query("SELECT * FROM reservation", (err, results) => {
    if (err) return res.status(500).json({ message: "Erreur chargement" });
    res.status(200).json(results);
  });
});

// ================================
// 🗑️ Supprimer une réservation (admin)
// ================================

  app.delete("/admin/reservations/:id", (req, res)=>{
    const id = req.params.id
    db.query("DELETE FROM reservation WHERE id =?", [id], (err, result)=>{
      if(err) return res.status(500).json({message:"Erreur de la suppression"});
      if(result.affectedRows===0){
        return res.status(404).json({message: "Reservation introuvable"});
      }
      res.status(200).json({message: "Réservation supprimée"});
    });
  });

// ================================
// 👥 Voir tous les utilisateurs (admin)
// ================================
app.get("/admin/utilisateurs", (req, res) => {
  db.query("SELECT id, username, email, role FROM users", (err, results) => {
    if (err) return res.status(500).json({ message: "Erreur chargement utilisateurs" });
    res.status(200).json(results);
  });
});

// ================================
// 🎚 Promouvoir un utilisateur (admin)
// ================================
app.patch("/admin/utilisateurs/:id/promouvoir", (req, res) => {
  const id = req.params.id;

  const sql = "UPDATE users SET role = 'admin' WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Erreur promotion" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.status(200).json({ message: "Utilisateur promu avec succès" });
  });
});

// ================================
// 🚀 Lancement du serveur
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
