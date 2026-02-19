# SAS C5 Receptor

Este proyecto es el componente receptor del sistema de coordinación de emergencias SAS (Sistema de Atención y Seguimiento). Su función principal es recibir los folios generados por el sistema C4 (Bitácora) y permitir su gestión y confirmación para la asignación de folios C5.

## Descripción

El sistema `sas-c5-receptor` actúa como un dashboard en tiempo real que:

1.  **Recibe Reportes**: Escucha mensajes de una cola SQS (Simple Queue Service) de AWS enviados por el sistema C4.
2.  **Visualización en Tiempo Real**: Utiliza WebSockets (`socket.io`) para mostrar los nuevos reportes en la interfaz de usuario sin necesidad de recargar la página.
3.  **Confirmación de Folios**: Permite a los operadores asignar un folio C5 a un incidente reportado por C4.
4.  **Sincronización**: Una vez confirmado el folio C5, notifica de vuelta al sistema C4 para mantener la consistencia de los datos.

## Tecnologías Utilizadas

*   **Node.js**: Entorno de ejecución.
*   **Express**: Framework web para el servidor y API.
*   **Socket.io**: Comunicación bidireccional en tiempo real entre el servidor y el cliente (Dashboard).
*   **AWS SDK (@aws-sdk/client-sqs)**: Cliente para interactuar con Amazon SQS.
*   **sqs-consumer**: Utilidad para procesar mensajes de SQS de manera eficiente.
*   **Dotenv**: Manejo de variables de entorno.
*   **Cors**: Middleware para permitir solicitudes de recursos cruzados.

## Instalación

1.  Clonar el repositorio:
    ```bash
    git clone https://github.com/Cristopher-P/Sas-c5-Receptor.git
    cd sas-c5-receptor
    ```

2.  Instalar dependencias:
    ```bash
    npm install
    ```

3.  Configurar variables de entorno:
    Crear un archivo `.env` basado en `.env.example` (si existe) o configurar las siguientes variables:
    ```env
    PORT=4000
    AWS_REGION=us-east-1
    AWS_ACCESS_KEY_ID=tu_access_key
    AWS_SECRET_ACCESS_KEY=tu_secret_key
    SQS_QUEUE_URL=url_de_tu_cola_sqs
    ```

## Uso

1.  Iniciar el servidor:
    ```bash
    node server.js
    ```
    O si se tiene configurado un script de inicio en `package.json`:
    ```bash
    npm start
    ```

2.  Acceder al Dashboard:
    Abrir el navegador en `http://localhost:4000` (o el puerto configurado).

## Estructura del Proyecto

*   `server.js`: Punto de entrada de la aplicación. Configura Express, Socket.io y el Worker SQS.
*   `services/SQSWorker.js`: Lógica para confirmar recepción y envío de mensajes a las colas SQS.
*   `public/`: Archivos estáticos del frontend (HTML, CSS, JS).
*   `storage.json`: Base de datos local simple (JSON) para persistencia temporal de reportes.

## Contribución

1.  Fork del repositorio.
2.  Crear una rama para la nueva funcionalidad (`git checkout -b feature/nueva-funcionalidad`).
3.  Commit de los cambios (`git commit -am 'Agrega nueva funcionalidad'`).
4.  Push a la rama (`git push origin feature/nueva-funcionalidad`).
5.  Crear un Pull Request.

## Licencia

ISC
