#!/bin/bash

API_URL="http://127.0.0.1:8000/api/v1"

GREEN="\e[32m"
RED="\e[31m"
BLUE="\e[34m"
YELLOW="\e[33m"
RESET="\e[0m"
CHECK="${GREEN}[✔]${RESET}"
CROSS="${RED}[✘]${RESET}"
INFO="${BLUE}[i]${RESET}"

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

function print_title() {
    echo -e "\n${YELLOW}== $1 ==${RESET}"
    ((TOTAL_TESTS++))
}

function print_result() {
    if [[ $1 == 0 ]]; then
        echo -e "${CHECK} $2"
        ((PASSED_TESTS++))
    else
        echo -e "${CROSS} $2"
        ((FAILED_TESTS++))
    fi
}

print_title "📁 Crear carpeta 'testfolder'"
curl -s -X POST "$API_URL/files/folder/create" \
    -H "Content-Type: application/json" \
    -d '{"folder":"testfolder"}' | jq .
print_result $? "Carpeta creada (o ya existente)"

print_title "📄 Listar todos los archivos"
curl -s "$API_URL/files/" | jq .
print_result $? "Archivos listados correctamente"

print_title "📤 Subir archivo 'test.txt' sin carpeta (default)"
curl -s -F "file=@/home/tay/Desktop/Projects/TelegramCloudSystem/TgCloudCLI/downloads/test.txt" "$API_URL/files/upload" | jq .
print_result $? "Archivo subido correctamente"

print_title "📤 Subir archivo 'test.txt' a 'testfolder'"
curl -s -F "file=@/home/tay/Desktop/Projects/TelegramCloudSystem/TgCloudCLI/downloads/test.txt" -F "folder=testfolder" "$API_URL/files/upload" | jq .
print_result $? "Archivo subido correctamente"

print_title "🔍 Obtener archivo por nombre (test.txt)"
curl -s "$API_URL/files/test.txt" | jq .
print_result $? "Archivo encontrado"

print_title "📂 Listar archivos en carpeta 'testfolder'"
curl -s "$API_URL/files/folder/testfolder" | jq .
print_result $? "Archivos listados en la carpeta"

print_title "📥 Descargar archivo 'test.txt'"
curl -s -o downloaded_test.txt "$API_URL/files/download/test.txt"
if [ -f downloaded_test.txt ]; then
    print_result 0 "Archivo descargado correctamente"
    rm downloaded_test.txt
else
    print_result 1 "Error al descargar el archivo"
fi

echo -e "\n${BLUE}========= RESUMEN =========${RESET}"
echo -e "Total:   $TOTAL_TESTS"
echo -e "${GREEN}Pasados: $PASSED_TESTS${RESET}"
echo -e "${RED}Fallidos: $FAILED_TESTS${RESET}"
echo -e "${BLUE}============================${RESET}\n"
