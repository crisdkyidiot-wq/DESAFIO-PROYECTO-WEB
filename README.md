# SIMTELE-WEB: Panel Interactivo de Prevención y Monitoreo

## Descripcion General
SIMTELE-WEB es una aplicacion web frontend desarrollada como solucion al desafio de la asignatura Programacion Web I. El sistema simula un panel de control para la prevencion y monitoreo de un sistema de transporte por cable (basado en Mi Teleferico). La aplicacion permite registrar, calcular y visualizar diferentes escenarios operativos mediante el uso de HTML, CSS y JavaScript puro.

## Arquitectura del Proyecto
El proyecto sigue una estructura modular de archivos estaticos, sin dependencias de frameworks externos (excepto Google Fonts para tipografia). La organizacion de directorios es la siguiente:

/
├── index.html          # Interfaz de autenticacion (Login, Registro, Recuperacion)
├── dashboard.html      # Panel principal con los cuatro modulos operativos
├── README.md           # Documentacion del proyecto
├── css/
│   └── styles.css      # Hoja de estilos unificada (Diseno minimalista B/N)
├── js/
│   ├── auth.js         # Logica de gestion de usuarios y sesiones (localStorage)
│   └── app.js          # Logica de negocio de los cuatro modulos y calendario
└── img/
    ├── logo-teleferico.png  # Identidad visual de la marca
    └── mapa-lineas.png      # Recurso grafico para el panel de inicio

## Caracteristicas y Modulos Implementados

El sistema cuenta con un mecanismo de autenticacion basado en `localStorage` que permite a los usuarios registrarse, iniciar sesion y recuperar su contrasena. Una vez autenticado, el usuario accede al dashboard, el cual contiene los siguientes modulos:

1. **Detencion de Emergencia:** Calcula la distancia recorrida durante el tiempo de reaccion mediante la formula `d = (v/3.6) * t`. Implementa validaciones de rango y clasifica el resultado en niveles de riesgo (Alto, Medio, Bajo) utilizando estructuras condicionales.
2. **Mantenimiento Programado:** Sistema de registro de componentes con horas de uso y estado operativo. Incluye un calendario dinamico que permite seleccionar rangos de fechas cruzando meses, con la capacidad de marcar tareas como completadas (tachado) y eliminarlas. Los datos persisten en el navegador.
3. **Viento y Oscilacion:** Modulo que recibe cinco mediciones de viento, calcula el promedio y el maximo mediante iteraciones, y clasifica la intensidad basandose en umbrales didacticos predefinidos.
4. **Registro de Sensores:** Valida la entrada de codigos de sensor mediante la expresion regular `/^SEN-\d{3}$/`. Verifica que los campos no esten vacios y que las lecturas sean valores numericos antes de almacenar y renderizar los registros.

## Requisitos Tecnicos Cumplidos

- **HTML Semantico:** Uso de etiquetas como `header`, `nav`, `main`, `section`, `aside` y `footer`.
- **JavaScript:** Implementacion de mas de 4 funciones propias, manejo del DOM, uso de `addEventListener`, arreglos de objetos, metodos `push`, `filter`, `forEach`, y expresiones regulares.
- **Persistencia:** Uso de `localStorage` para conservar los registros de mantenimiento, sensores y la sesion del usuario al recargar la pagina.
- **CSS:** Diseno responsivo con media queries, paleta de colores monocromatica (blanco y negro) y tipografia definida mediante variables CSS.

## Instrucciones de Uso

1. Descargue o clone el repositorio en su equipo local.
2. Abra el archivo `index.html` en un navegador web moderno. Se recomienda el uso de un servidor local (como Live Server de Visual Studio Code) para evitar restricciones de seguridad del navegador con `localStorage`.
3. En la pantalla de inicio, cree una cuenta nueva utilizando la opcion "Crear cuenta".
4. Inicie sesion con las credenciales registradas.
5. Navegue entre los modulos utilizando el menu lateral izquierdo.
6. Para el modulo de mantenimiento, seleccione una linea de teleferico, un rango de fechas en el calendario y complete el formulario para agregar un registro. Puede marcar la tarea como realizada o eliminarla desde la tabla.

## Aviso Importante
Todos los umbrales, calculos y resultados presentados en esta aplicacion son de caracter didactico y simulado. No representan bajo ninguna circunstancia limites operativos reales ni datos oficiales de Mi Teleferico.

## Autores
- Christian Aguayo Condori
- Cristian Pablo Rojas Condori

## Contexto Academico
Proyecto desarrollado para la asignatura Programacion Web I. Desafio presencial de dos horas.