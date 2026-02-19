/**
 * Módulo API - Manejo de copmunicación con el servidor
 */

export const API = {
    /**
     * Envía la confirmación del folio al backend
     * @param {string} folioC4 
     * @param {string} folioC5 
     */
    async confirmarFolio(folioC4, folioC5) {
        try {
            const response = await fetch('/api/confirmar-folio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ folio_c4: folioC4, folio_c5: folioC5 })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error confirmando folio:', error);
            throw error;
        }
    }
};
