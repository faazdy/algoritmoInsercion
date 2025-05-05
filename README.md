
# Instrucciones para ejecutar el algoritmo

Para que el algoritmo funcione correctamente, sigue los siguientes pasos:

## 1. Instalación de dependencias

Si has clonado este repositorio desde GitHub, primero debes instalar las dependencias del proyecto. Abre una terminal en la raíz del proyecto y ejecuta el siguiente comando:

```bash
npm install
```

## 2. Ejecución del algoritmo

Una vez que las dependencias estén instaladas, ejecuta el siguiente comando para iniciar el algoritmo principal:

```bash
npx ts-node app.ts
```

**Nota**: Asegúrate de tener los archivos correctos en la carpeta `data` antes de ejecutar este paso.

## 3. Verificación de los archivos de datos

Asegúrate de que la carpeta `data` contenga los siguientes archivos en formato `.json`:

- `daily.json`
- `hourly.json`
- `list.json`
- `monthly.json`

Estos archivos contienen los datos que se insertarán en la base de datos.

## 4. Inserción de datos en la base de datos

Para insertar los datos en la base de datos relacional, ejecuta el siguiente comando:

```bash
npx ts-node insertdb.ts
```

Este paso tomará los datos de la carpeta `data` y los insertará en la base de datos.

