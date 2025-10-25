import { Router } from "express";
import { addApertura, getAsiento, deleteApertura, getDatos } from "../controllers/asientocontroller.js";

const router = Router();

// Insertar o actualizar
router.post("/add", addApertura);

// Obtener datos del asiento
router.get("/datos", getDatos);

// routes/apertura.routes.js
router.delete("/:id_cuenta", deleteApertura);

router.get("/asiento", getAsiento);

export default router;