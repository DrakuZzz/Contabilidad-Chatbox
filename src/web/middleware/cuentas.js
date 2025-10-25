document.addEventListener("DOMContentLoaded", () => {
    addCuentas();
});

async function addCuentas() {
    try {
        const btn = document.getElementById("add");
        if (!btn) return;

        btn.addEventListener("click", async (e) => {
            e.preventDefault();

            const Numero = document.getElementById("Numero").value.trim();
            const Cuenta = document.getElementById("Cuenta").value.trim();
            const tipo = document.getElementById("tipo").value.trim();

            if (!Numero || !Cuenta || !tipo) {
                alert("⚠️ Por favor, complete todos los campos.");
                return;
            }

            try {
                const response = await fetch("/catalogo/add", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ Numero, Cuenta, tipo }),
                });

                const data = await response.json();

                if (data.success) {
                    alert(`✅ ${data.message}`);
                    document.getElementById("Numero").value = "";
                    document.getElementById("Cuenta").value = "";
                    document.getElementById("tipo").value = "";
                } else {
                    alert(`❌ ${data.message}`);
                }
            } catch (err) {
                console.error("Error en la solicitud:", err);
                alert("❌ Error en la conexión con el servidor.");
            }
        });

    } catch (error) {
        console.error("Error al inicializar addCuentas:", error);
    }
}
