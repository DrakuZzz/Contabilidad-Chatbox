import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import {
  cuentasRoutes,
  aperturaRoutes,
  facturaRoutes,
  reportesRoutes,
} from "../routes/index.js"; 

dotenv.config();

const PORT = process.env.PORT || 3000;  // Default si no hay env

const app = express();
app.use(express.json());
app.use(express.static("src"));
app.use(cors());

app.use("/catalogo", cuentasRoutes);
app.use("/apertura", aperturaRoutes);
app.use("", facturaRoutes);
app.use("/api/reportes", reportesRoutes);  // Nuevo: API para reportes

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Rutas para páginas existentes
app.get("/", (req, res) => {
  res.sendFile(path.resolve("src/web/pages/transacciones.html"));
});

app.get("/addcuentas", (req, res) => {
  res.sendFile(path.resolve("src/web/pages/cuentas.html"));
});

app.get("/asiento", (req, res) => {
  res.sendFile(path.resolve("src/web/pages/asiento.html"));
});

app.get("/factura", (req, res) => {
  res.sendFile(path.resolve("src/web/pages/factura.html"));
});

// Nuevas rutas para páginas de reportes
app.get("/libro-diario", (req, res) => {
  res.sendFile(path.resolve("src/web/pages/libro-diario.html"));
});

app.get("/libro-mayor", (req, res) => {
  res.sendFile(path.resolve("src/web/pages/libro-mayor.html"));
});

app.get("/balanza-comprobacion", (req, res) => {
  res.sendFile(path.resolve("src/web/pages/balanza-comprobacion.html"));
});

app.get("/estado-resultado", (req, res) => {
  res.sendFile(path.resolve("src/web/pages/estado-resultado.html"));
});
