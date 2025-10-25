import { Router } from "express";
import { 
    getLibroDiario, 
    getLibroMayor, 
    getBalanzaComprobacion, 
    getBalanceGeneral
} from "../controllers/reportescontroller.js";

const router = Router();

// API endpoints para reportes (usa /api/reportes/ como prefijo en el servidor)
router.get("/libro-diario", getLibroDiario);
router.get("/libro-mayor", getLibroMayor);
router.get("/balanza-comprobacion", getBalanzaComprobacion);
router.get("/balance-general", getBalanceGeneral);

export default router;