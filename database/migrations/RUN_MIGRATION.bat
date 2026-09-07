@echo off
REM Script para ejecutar migración de stock
REM Asegúrate de tener psql en el PATH o modifica la ruta abajo

echo ============================================
echo Ejecutando migración: Campos de Stock
echo ============================================
echo.

REM Configurar password de PostgreSQL
set PGPASSWORD=123456

REM Ejecutar migración
REM Si psql no está en el PATH, reemplaza "psql" con la ruta completa, ejemplo:
REM "C:\Program Files\PostgreSQL\16\bin\psql.exe"

psql -h localhost -U postgres -d tienda_wsp -f "001_add_stock_fields.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo ✅ Migración ejecutada exitosamente
    echo ============================================
    echo.
    echo Campos agregados a la tabla products:
    echo  - stock (INTEGER, default 0)
    echo  - low_stock_threshold (INTEGER, default 5)
    echo.
    echo Productos existentes actualizados con:
    echo  - stock = 10
    echo  - low_stock_threshold = 5
    echo ============================================
) else (
    echo.
    echo ============================================
    echo ❌ Error al ejecutar migración
    echo ============================================
    echo.
    echo Posibles soluciones:
    echo 1. Verifica que PostgreSQL esté instalado
    echo 2. Verifica que psql esté en el PATH
    echo 3. Verifica las credenciales en el script
    echo 4. Ejecuta manualmente el archivo 001_add_stock_fields.sql
    echo ============================================
)

echo.
pause
